import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Space,
  Card,
  Divider,
  Tag,
  Popconfirm,
  message,
  Row,
  Col,
  Checkbox
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { ArrivalRecord, Customer, Shipment } from '../types';
import { dataStore, ExtendedFreightPayment } from '../services/dataStore';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const ArrivalRecords: React.FC = () => {
  const [arrivalRecords, setArrivalRecords] = useState<ArrivalRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableShipments, setAvailableShipments] = useState<Shipment[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ArrivalRecord | null>(null);
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [arrivalWeights, setArrivalWeights] = useState<{ [key: string]: number }>({});
  const [isFreightPaymentVisible, setIsFreightPaymentVisible] = useState(false);
  const [isReceivablePaymentVisible, setIsReceivablePaymentVisible] = useState(false);
  const [freightPayments, setFreightPayments] = useState<ExtendedFreightPayment[]>([]);
  const [currentArrivalRecordId, setCurrentArrivalRecordId] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [freightPaymentForm] = Form.useForm();
  const [receivablePaymentForm] = Form.useForm();

  // 监听全局数据变化
  useEffect(() => {
    const updateFreightPayments = () => {
      setFreightPayments(dataStore.getFreightPayments());
    };
    
    // 初始化数据
    updateFreightPayments();
    
    // 添加监听器
    dataStore.addListener(updateFreightPayments);
    
    // 清理监听器
    return () => {
      dataStore.removeListener(updateFreightPayments);
    };
  }, []);

  // 模拟数据初始化
  useEffect(() => {
    // 模拟客户数据
    const mockCustomers: Customer[] = [
      { id: '1', name: '华能电厂', contact: '张经理', phone: '13800138001', address: '北京市朝阳区', createdAt: '2024-01-01' },
      { id: '2', name: '大唐电厂', contact: '李经理', phone: '13800138002', address: '天津市河西区', createdAt: '2024-01-02' },
    ];

    // 模拟可用车单数据（已发货但未到货的车单）
    const mockShipments: Shipment[] = [
      {
        id: 'ship1',
        batchId: 'batch1',
        vehicleId: 'vehicle1',
        plateNumber: '京A12345',
        driverName: '王师傅',
        driverId: 'driver1',
        customerId: '1',
        customerName: '华能电厂',
        supplierId: 'supplier1',
        supplierName: '山西煤业',
        coalPrice: 800,
        freightPrice: 120,
        weight: 35,
        coalAmount: 28000,
        freightAmount: 4200,
        departureDate: '2024-11-01',
        status: 'shipping',
        createdAt: '2024-11-01'
      },
      {
        id: 'ship2',
        batchId: 'batch1',
        vehicleId: 'vehicle2',
        plateNumber: '京B67890',
        driverName: '李师傅',
        driverId: 'driver2',
        customerId: '1',
        customerName: '华能电厂',
        supplierId: 'supplier1',
        supplierName: '山西煤业',
        coalPrice: 800,
        freightPrice: 120,
        weight: 40,
        coalAmount: 32000,
        freightAmount: 4800,
        departureDate: '2024-11-01',
        status: 'shipping',
        createdAt: '2024-11-01'
      }
    ];

    setCustomers(mockCustomers);
    setAvailableShipments(mockShipments);

    // 模拟到货记录数据
    const mockArrivalRecords: ArrivalRecord[] = [
      {
        id: 'arrival1',
        arrivalDate: '2024-11-15',
        customerId: '1',
        customerName: '华能电厂',
        freightPerTon: 120,
        sellingPricePerTon: 800,
        totalWeight: 70,
        totalLoss: 2.5,
        totalReceivable: 56000,
        actualFreightPaid: 8000,
        freightPaymentStatus: 'partial',
        actualReceived: 30000,
        receivablePaymentStatus: 'partial',
        status: 'completed',
        remark: '第一批到货',
        relatedShipments: [
          {
            id: 'arrival_ship1',
            arrivalRecordId: 'arrival1',
            shipmentId: 'ship1',
            plateNumber: '京A12345',
            driverName: '王师傅',
            originalWeight: 35,
            arrivalWeight: 34,
            loss: 1,
            receivableAmount: 27200 // 34 * 800
          },
          {
            id: 'arrival_ship2',
            arrivalRecordId: 'arrival1',
            shipmentId: 'ship2',
            plateNumber: '京B67890',
            driverName: '李师傅',
            originalWeight: 40,
            arrivalWeight: 38.5,
            loss: 1.5,
            receivableAmount: 30800 // 38.5 * 800
          }
        ],
        createdAt: '2024-11-15'
      }
    ];

    setArrivalRecords(mockArrivalRecords);
  }, []);

  // 表格列定义
  const columns: ColumnsType<ArrivalRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '到货日期',
      dataIndex: 'arrivalDate',
      key: 'arrivalDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '客户名称',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '车辆数',
      key: 'vehicleCount',
      render: (_, record) => record.relatedShipments.length,
    },
    {
      title: '总重量(吨)',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      render: (weight: number) => weight.toFixed(2),
    },
    {
      title: '总运损(吨)',
      dataIndex: 'totalLoss',
      key: 'totalLoss',
      render: (loss: number) => (
        <span style={{ color: loss > 0 ? '#ff4d4f' : '#52c41a' }}>
          {loss.toFixed(2)}
        </span>
      ),
    },
    {
      title: '总应收款(元)',
      dataIndex: 'totalReceivable',
      key: 'totalReceivable',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '实付运费(元)',
      dataIndex: 'actualFreightPaid',
      key: 'actualFreightPaid',
      render: (amount: number) => `¥${amount.toLocaleString()}`,
    },
    {
      title: '运费平账状态',
      dataIndex: 'freightPaymentStatus',
      key: 'freightPaymentStatus',
      render: (status: string) => {
        const statusMap = {
          'unpaid': { color: 'red', text: '未平账' },
          'partial': { color: 'orange', text: '部分平账' },
          'paid': { color: 'green', text: '已平账' }
        };
        const config = statusMap[status as keyof typeof statusMap] || statusMap.unpaid;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '实收款(元)',
      dataIndex: 'actualReceived',
      key: 'actualReceived',
      render: (amount: number) => `¥${amount?.toLocaleString() || '0'}`,
    },
    {
      title: '收款平账状态',
      dataIndex: 'receivablePaymentStatus',
      key: 'receivablePaymentStatus',
      render: (status: string) => {
        const statusMap = {
          'unpaid': { color: 'red', text: '未收款' },
          'partial': { color: 'orange', text: '部分收款' },
          'paid': { color: 'green', text: '已收款' }
        };
        const config = statusMap[status as keyof typeof statusMap] || statusMap.unpaid;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? '已完成' : '待处理'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            onClick={() => handleFreightPayment(record)}
            style={{ color: '#1890ff' }}
          >
            付运费
          </Button>
          <Button
            type="link"
            onClick={() => handleReceivablePayment(record)}
            style={{ color: '#52c41a' }}
          >
            记录收款
          </Button>
          <Popconfirm
            title="确定删除这条到货记录吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理新增
  const handleAdd = () => {
    setEditingRecord(null);
    setSelectedShipments([]);
    setArrivalWeights({});
    form.resetFields();
    setIsModalVisible(true);
  };

  // 处理编辑
  const handleEdit = (record: ArrivalRecord) => {
    setEditingRecord(record);
    setSelectedShipments(record.relatedShipments.map(s => s.shipmentId));
    
    const weights: { [key: string]: number } = {};
    record.relatedShipments.forEach(s => {
      weights[s.shipmentId] = s.arrivalWeight;
    });
    setArrivalWeights(weights);

    form.setFieldsValue({
      arrivalDate: dayjs(record.arrivalDate),
      freightPerTon: record.freightPerTon,
      sellingPricePerTon: record.sellingPricePerTon,
      customerId: record.customerId,
      actualFreightPaid: record.actualFreightPaid,
      remark: record.remark,
    });
    setIsModalVisible(true);
  };

  // 处理查看
  const handleView = (record: ArrivalRecord) => {
    // 这里可以实现查看详情的逻辑
    message.info('查看功能待实现');
  };

  // 处理删除
  const handleDelete = (id: string) => {
    setArrivalRecords(prev => prev.filter(record => record.id !== id));
    message.success('删除成功');
  };

  // 处理运费支付
  const handleFreightPayment = (record: ArrivalRecord) => {
    setCurrentArrivalRecordId(record.id);
    setIsFreightPaymentVisible(true);
  };

  // 处理收款记录
  const handleReceivablePayment = (record: ArrivalRecord) => {
    setCurrentArrivalRecordId(record.id);
    receivablePaymentForm.setFieldsValue({
      arrivalRecordId: record.id,
      totalReceivable: record.totalReceivable,
      actualReceived: record.actualReceived || 0,
    });
    setIsReceivablePaymentVisible(true);
  };

  // 处理车单选择变化
  const handleShipmentSelection = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments(prev => [...prev, shipmentId]);
      // 初始化到货重量为发货重量
      const shipment = availableShipments.find(s => s.id === shipmentId);
      if (shipment) {
        setArrivalWeights(prev => ({
          ...prev,
          [shipmentId]: shipment.weight
        }));
      }
    } else {
      setSelectedShipments(prev => prev.filter(id => id !== shipmentId));
      setArrivalWeights(prev => {
        const newWeights = { ...prev };
        delete newWeights[shipmentId];
        return newWeights;
      });
    }
  };

  // 处理到货重量变化
  const handleArrivalWeightChange = (shipmentId: string, weight: number) => {
    setArrivalWeights(prev => ({
      ...prev,
      [shipmentId]: weight || 0
    }));
  };

  // 计算所有相关数据
  const calculateTotals = () => {
    const selectedShipmentData = availableShipments.filter(s => selectedShipments.includes(s.id));
    
    // 计算到货总称重
    const totalArrivalWeight = selectedShipmentData.reduce((sum, shipment) => {
      const arrivalWeight = arrivalWeights[shipment.id] || shipment.weight;
      return sum + arrivalWeight;
    }, 0);
    
    // 计算总运损
    const totalLoss = selectedShipmentData.reduce((sum, shipment) => {
      const arrivalWeight = arrivalWeights[shipment.id] || shipment.weight;
      const loss = shipment.weight - arrivalWeight;
      return sum + loss;
    }, 0);
    
    // 计算应付总运费
    const totalFreightPayable = selectedShipmentData.reduce((sum, shipment) => {
      const arrivalWeight = arrivalWeights[shipment.id] || shipment.weight;
      const freightPrice = form.getFieldValue('freightPerTon') || shipment.freightPrice || 0;
      return sum + (arrivalWeight * freightPrice);
    }, 0);
    
    // 计算总应收款
    const totalReceivable = selectedShipmentData.reduce((sum, shipment) => {
      const arrivalWeight = arrivalWeights[shipment.id] || shipment.weight;
      const sellingPrice = form.getFieldValue('sellingPricePerTon') || 0;
      return sum + (arrivalWeight * sellingPrice);
    }, 0);
    
    return {
      totalArrivalWeight: Number(totalArrivalWeight.toFixed(2)),
      totalLoss: Number(totalLoss.toFixed(2)),
      totalFreightPayable: Number(totalFreightPayable.toFixed(2)),
      totalReceivable: Number(totalReceivable.toFixed(2))
    };
  };

  // 获取过滤后的车单（根据客户和状态）
  const getFilteredShipments = () => {
    const customerId = form.getFieldValue('customerId');
    if (!customerId) return [];
    
    return availableShipments.filter((shipment: any) => 
      shipment.customerId === customerId && 
      shipment.status === 'shipping'
    );
  };

  const { totalArrivalWeight, totalLoss, totalFreightPayable, totalReceivable } = calculateTotals();

  // 处理提交
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      // 这里将来会调用API保存数据
      message.success('到货记录保存成功！');
      setIsModalVisible(false);
      form.resetFields();
      setSelectedShipments([]);
      setArrivalWeights({});
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>到货记录管理</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增到货记录
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={arrivalRecords}
          rowKey="id"
          pagination={{
            total: arrivalRecords.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 新增/编辑到货记录模态框 */}
      <Modal
        title={editingRecord ? '编辑到货记录' : '新增到货记录'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={1000}
        okText="确定"
        cancelText="取消"
      >
        <Form 
          form={form} 
          layout="vertical"
          onValuesChange={() => {
            // 当表单值变化时强制重新渲染以更新计算结果
            setTimeout(() => {
              setSelectedShipments([...selectedShipments]);
            }, 0);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="arrivalDate"
                label="到货日期"
                rules={[{ required: true, message: '请选择到货日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择到货日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="customerId"
                label="客户名称"
                rules={[{ required: true, message: '请选择客户' }]}
              >
                <Select placeholder="请选择客户">
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id}>
                      {customer.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="freightPerTon"
                label="运费/吨(元)"
                rules={[
                  { required: true, message: '请输入运费/吨' },
                  { type: 'number', min: 0, message: '运费必须大于等于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入运费/吨"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sellingPricePerTon"
                label="售价/吨(元)"
                rules={[
                  { required: true, message: '请输入售价/吨' },
                  { type: 'number', min: 0, message: '售价必须大于等于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入售价/吨"
                  precision={2}
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>关联车单信息</Divider>
          <div style={{ marginBottom: 16 }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              请先选择客户，然后选择要关联的车单：
            </span>
          </div>
          
          {getFilteredShipments().length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: '6px', padding: '16px' }}>
              {getFilteredShipments().map((shipment: any) => (
                <div key={shipment.id} style={{ 
                  marginBottom: '12px', 
                  padding: '12px', 
                  border: '1px solid #f0f0f0', 
                  borderRadius: '4px',
                  backgroundColor: selectedShipments.includes(shipment.id) ? '#f6ffed' : '#fafafa'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <Checkbox
                      checked={selectedShipments.includes(shipment.id)}
                      onChange={(e) => handleShipmentSelection(shipment.id, e.target.checked)}
                    >
                      <strong>{shipment.plateNumber}</strong> - {shipment.driverName}
                    </Checkbox>
                  </div>
                  
                  <Row gutter={16}>
                    <Col span={6}>
                      <div style={{ fontSize: '12px', color: '#666' }}>发货重量</div>
                      <div style={{ fontWeight: 'bold' }}>{shipment.weight} 吨</div>
                    </Col>
                    <Col span={6}>
                      <div style={{ fontSize: '12px', color: '#666' }}>发货日期</div>
                      <div>{dayjs(shipment.departureDate).format('MM-DD')}</div>
                    </Col>
                    <Col span={6}>
                      <div style={{ fontSize: '12px', color: '#666' }}>煤价</div>
                      <div>¥{shipment.coalPrice}/吨</div>
                    </Col>
                    <Col span={6}>
                      <div style={{ fontSize: '12px', color: '#666' }}>运费</div>
                      <div>¥{shipment.freightPrice}/吨</div>
                    </Col>
                  </Row>
                  
                  {selectedShipments.includes(shipment.id) && (
                    <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px' }}>
                      <Row gutter={16} align="middle">
                        <Col span={8}>
                          <span style={{ fontSize: '12px', color: '#666' }}>到货称重(吨)：</span>
                        </Col>
                        <Col span={16}>
                          <InputNumber
                            value={arrivalWeights[shipment.id] || shipment.weight}
                            onChange={(value) => handleArrivalWeightChange(shipment.id, value || 0)}
                            style={{ width: '100%' }}
                            precision={2}
                            min={0}
                            placeholder="请输入到货称重"
                          />
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: '8px' }}>
                        <Col span={8}>
                          <span style={{ fontSize: '12px', color: '#666' }}>运损：</span>
                        </Col>
                        <Col span={16}>
                          <span style={{ 
                            color: (shipment.weight - (arrivalWeights[shipment.id] || shipment.weight)) > 0 ? '#ff4d4f' : '#52c41a',
                            fontWeight: 'bold'
                          }}>
                            {(shipment.weight - (arrivalWeights[shipment.id] || shipment.weight)).toFixed(2)} 吨
                          </span>
                        </Col>
                      </Row>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: '#f5f5f5', 
              borderRadius: '6px',
              color: '#999'
            }}>
              {form.getFieldValue('customerId') ? '该客户暂无可关联的在途车单' : '请先选择客户'}
            </div>
          )}

          <Divider>付款信息</Divider>
          
          {/* 计算结果显示 */}
          <Row gutter={16} style={{ marginBottom: 16, padding: '16px', backgroundColor: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>到货总称重</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
                  {totalArrivalWeight.toFixed(2)} 吨
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>总运损</div>
                <div style={{ 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  color: totalLoss > 0 ? '#ff4d4f' : '#52c41a' 
                }}>
                  {totalLoss.toFixed(2)} 吨
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>应付总运费</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16' }}>
                  ¥{totalFreightPayable.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>总应收款</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  ¥{totalReceivable.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </Col>
          </Row>
          
          {/* 选中车单数显示 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={24}>
              <div style={{ textAlign: 'center', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  已选中 <strong style={{ color: '#722ed1' }}>{selectedShipments.length}</strong> 辆车单
                </span>
              </div>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>运费支付</label>
                <Button 
                  type="primary" 
                  onClick={() => {
                    setCurrentArrivalRecordId(editingRecord?.id || 'new');
                    setIsFreightPaymentVisible(true);
                  }}
                  style={{ width: '100%' }}
                >
                  去付运费
                </Button>
              </div>
            </Col>
            <Col span={12}>
              <Form.Item
                name="remark"
                label="备注"
              >
                <TextArea
                  placeholder="请输入备注信息"
                  rows={3}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* 运费支付弹窗 */}
      <Modal
        title="运费支付管理"
        open={isFreightPaymentVisible}
        onCancel={() => {
          setIsFreightPaymentVisible(false);
          freightPaymentForm.resetFields();
        }}
        width={900}
        footer={null}
      >
        <div>
          {/* 应付总金额显示 */}
          <Card style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  应付运费总金额：¥{calculateTotals().totalFreightPayable.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                {(() => {
                  const totalPayable = calculateTotals().totalFreightPayable;
                  const totalPaid = freightPayments
                    .filter(payment => payment.arrivalRecordId === currentArrivalRecordId)
                    .reduce((sum, payment) => sum + payment.actualAmount, 0);
                  const remaining = totalPayable - totalPaid;
                  
                  return (
                    <span style={{ fontSize: '14px', color: remaining > 0 ? '#fa8c16' : '#52c41a' }}>
                      已付：¥{totalPaid.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} | 
                      剩余：¥{remaining.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  );
                })()}
              </div>
            </div>
          </Card>

          {/* 新增支付记录表单 */}
          <Card title="新增支付记录" style={{ marginBottom: 16 }}>
            <Form 
              form={freightPaymentForm} 
              layout="vertical"
              onFinish={(values) => {
                if (!currentArrivalRecordId) return;
                
                // 获取当前到货记录的相关车单信息
                const selectedShipmentData = availableShipments.filter(s => selectedShipments.includes(s.id));
                const plateNumbers = selectedShipmentData.map(s => s.plateNumber);
                const driverNames = Array.from(new Set(selectedShipmentData.map(s => s.driverName)));
                
                const newPayment: ExtendedFreightPayment = {
                  id: Date.now().toString(),
                  arrivalRecordId: currentArrivalRecordId,
                  driverId: selectedShipmentData[0]?.driverId || 'unknown',
                  driverName: driverNames.join(', '),
                  plateNumbers: plateNumbers,
                  calculatedAmount: calculateTotals().totalFreightPayable,
                  actualAmount: values.amount,
                  paymentDate: values.paymentDate.format('YYYY-MM-DD'),
                  remark: values.remark || '',
                  createdAt: new Date().toISOString()
                };
                
                // 同步到全局数据存储
                dataStore.addFreightPayment(newPayment);
                freightPaymentForm.resetFields();
                message.success('支付记录添加成功并已同步到付款管理');
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="amount"
                    label="支付金额(元)"
                    rules={[
                      { required: true, message: '请输入支付金额' },
                      { type: 'number', min: 0.01, message: '支付金额必须大于0' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="请输入支付金额"
                      precision={2}
                      min={0.01}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="paymentDate"
                    label="支付日期"
                    rules={[{ required: true, message: '请选择支付日期' }]}
                  >
                    <DatePicker style={{ width: '100%' }} placeholder="请选择支付日期" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="paymentMethod"
                    label="支付方式"
                    rules={[{ required: true, message: '请选择支付方式' }]}
                  >
                    <Select placeholder="请选择支付方式">
                      <Option value="bank_card">银行卡</Option>
                      <Option value="wechat_direct">微信直接转账</Option>
                      <Option value="wechat_indirect">微信间接转账</Option>
                      <Option value="cash">现金</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="remark"
                    label="备注"
                  >
                    <Input placeholder="请输入备注信息" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button type="primary" htmlType="submit">
                    添加支付记录
                  </Button>
                  <Button 
                    type="default" 
                    style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
                    onClick={() => {
                      if (!currentArrivalRecordId) return;
                      
                      const totalPayable = calculateTotals().totalFreightPayable;
                      const totalPaid = freightPayments
                        .filter(payment => payment.arrivalRecordId === currentArrivalRecordId)
                        .reduce((sum, payment) => sum + payment.actualAmount, 0);
                      const remaining = totalPayable - totalPaid;
                      
                      if (remaining <= 0) {
                        message.warning('当前已无剩余金额需要平账');
                        return;
                      }
                      
                      Modal.confirm({
                        title: '确认平账结算',
                        content: `确定要对剩余金额 ¥${remaining.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} 进行平账结算吗？平账后将不再追缴此部分款项。`,
                        okText: '确认平账',
                        cancelText: '取消',
                        onOk: () => {
                          // 获取当前到货记录的相关车单信息
                          const selectedShipmentData = availableShipments.filter(s => selectedShipments.includes(s.id));
                          const plateNumbers = selectedShipmentData.map(s => s.plateNumber);
                          const driverNames = Array.from(new Set(selectedShipmentData.map(s => s.driverName)));
                          
                          const balancePayment: ExtendedFreightPayment = {
                            id: Date.now().toString(),
                            arrivalRecordId: currentArrivalRecordId,
                            driverId: selectedShipmentData[0]?.driverId || 'unknown',
                            driverName: driverNames.join(', '),
                            plateNumbers: plateNumbers,
                            calculatedAmount: totalPayable,
                            actualAmount: 0, // 平账金额为0
                            paymentDate: new Date().toISOString().split('T')[0],
                            remark: `平账结算 - 免缴剩余运费 ¥${remaining.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`,
                            createdAt: new Date().toISOString()
                          };
                          
                          // 同步到全局数据存储
                          dataStore.addFreightPayment(balancePayment);
                          message.success('平账结算完成，已同步到付款管理');
                        }
                      });
                    }}
                  >
                    平账结算
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </Card>

          {/* 支付记录列表 */}
          <Card title="支付记录列表">
            <Table
              dataSource={freightPayments.filter(payment => payment.arrivalRecordId === currentArrivalRecordId)}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: '支付金额',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
                },
                {
                  title: '支付日期',
                  dataIndex: 'paymentDate',
                  key: 'paymentDate'
                },
                {
                  title: '支付方式',
                  dataIndex: 'paymentMethod',
                  key: 'paymentMethod',
                  render: (method) => {
                    const methodMap = {
                      bank_card: '银行卡',
                      wechat_direct: '微信直接转账',
                      wechat_indirect: '微信间接转账',
                      cash: '现金'
                    };
                    return methodMap[method as keyof typeof methodMap] || method;
                  }
                },
                {
                  title: '备注',
                  dataIndex: 'remark',
                  key: 'remark'
                },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record) => (
                    <Popconfirm
                      title="确定要删除这条支付记录吗？"
                      onConfirm={() => {
                        dataStore.removeFreightPayment(record.id);
                        message.success('支付记录删除成功并已同步到付款管理');
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button type="link" danger size="small">
                        删除
                      </Button>
                    </Popconfirm>
                  )
                }
              ]}
              summary={(pageData) => {
                const total = pageData.reduce((sum, record) => sum + record.actualAmount, 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <strong>总计支付金额</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong style={{ color: '#1890ff' }}>
                        ¥{total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
            
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                type="primary" 
                onClick={() => {
                  setIsFreightPaymentVisible(false);
                  message.success('运费支付信息已保存');
                }}
              >
                确认完成
              </Button>
            </div>
          </Card>
        </div>
      </Modal>

      {/* 收款记录弹窗 */}
      <Modal
        title="收款记录管理"
        open={isReceivablePaymentVisible}
        onCancel={() => {
          setIsReceivablePaymentVisible(false);
          receivablePaymentForm.resetFields();
        }}
        width={600}
        footer={null}
      >
        <Form
          form={receivablePaymentForm}
          layout="vertical"
          onFinish={(values) => {
            // 更新到货记录的收款信息
            setArrivalRecords(prev => prev.map(record => {
              if (record.id === currentArrivalRecordId) {
                const actualReceived = values.actualReceived || 0;
                const totalReceivable = record.totalReceivable;
                let receivablePaymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
                
                if (actualReceived >= totalReceivable) {
                  receivablePaymentStatus = 'paid';
                } else if (actualReceived > 0) {
                  receivablePaymentStatus = 'partial';
                }
                
                return {
                  ...record,
                  actualReceived,
                  receivablePaymentStatus
                };
              }
              return record;
            }));
            
            setIsReceivablePaymentVisible(false);
            message.success('收款记录已保存');
          }}
        >
          <Card style={{ marginBottom: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
                  应收款总金额：¥{arrivalRecords.find(r => r.id === currentArrivalRecordId)?.totalReceivable?.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>
              <div>
                {(() => {
                  const record = arrivalRecords.find(r => r.id === currentArrivalRecordId);
                  const totalReceivable = record?.totalReceivable || 0;
                  const actualReceived = record?.actualReceived || 0;
                  const remaining = totalReceivable - actualReceived;
                  
                  return (
                    <span style={{ fontSize: '14px', color: remaining > 0 ? '#fa8c16' : '#52c41a' }}>
                      已收：¥{actualReceived.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} | 
                      剩余：¥{remaining.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </span>
                  );
                })()}
              </div>
            </div>
          </Card>

          <Form.Item
            name="actualReceived"
            label="实收金额"
            rules={[
              { required: true, message: '请输入实收金额' },
              { type: 'number', min: 0, message: '金额不能为负数' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入实收金额"
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value!.replace(/¥\s?|(,*)/g, '')}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="receivedDate"
            label="收款日期"
            rules={[{ required: true, message: '请选择收款日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="收款方式"
            rules={[{ required: true, message: '请选择收款方式' }]}
          >
            <Select placeholder="请选择收款方式">
              <Option value="cash">现金</Option>
              <Option value="bank_transfer">银行转账</Option>
              <Option value="check">支票</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea
              placeholder="请输入备注信息"
              rows={3}
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsReceivablePaymentVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存收款记录
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ArrivalRecords;