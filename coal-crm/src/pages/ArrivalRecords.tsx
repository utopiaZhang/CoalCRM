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
import { ArrivalRecord, Customer, Shipment, CustomerPayment } from '../types';
import { ExtendedFreightPayment } from '../services/dataStore';
import { paymentsService } from '../services/payments';
import { customersService } from '../services/customers';
import { shipmentsService } from '../services/shipments';
import { arrivalRecordsService } from '../services/arrivalRecords';
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
  const [isViewVisible, setIsViewVisible] = useState(false);
  const [viewRecord, setViewRecord] = useState<ArrivalRecord | null>(null);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>([]);
  const [form] = Form.useForm();
  const [freightPaymentForm] = Form.useForm();
  const [receivablePaymentForm] = Form.useForm();

  // 初始化从后端加载运费支付记录
  useEffect(() => {
    paymentsService.listFreight()
      .then(setFreightPayments)
      .catch(err => {
        console.error(err);
        message.error('加载运费支付记录失败');
      });
  }, []);

  // 初始化从后端加载客户、可用车单与到货记录
  useEffect(() => {
    const loadData = async () => {
      try {
        const [customerList, shipmentList, arrivalList] = await Promise.all([
          customersService.list(),
          shipmentsService.list(),
          arrivalRecordsService.list()
        ]);
        setCustomers(customerList);
        setAvailableShipments((shipmentList || []).filter(s => s.status === 'shipping'));
        setArrivalRecords(arrivalList || []);
      } catch (err) {
        console.error(err);
        message.error('加载到货记录相关数据失败');
      }
    };
    loadData();
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
    setViewRecord(record);
    setIsViewVisible(true);
    paymentsService.listCustomer()
      .then(list => {
        setCustomerPayments(list.filter(p => p.arrivalRecordId === record.id));
      })
      .catch(err => {
        console.error(err);
        message.error('加载客户收款记录失败');
      });
  };

  // 处理删除
  const handleDelete = (id: string) => {
    arrivalRecordsService.remove(id)
      .then(() => {
        setArrivalRecords(prev => prev.filter(record => record.id !== id));
        message.success('到货记录已删除');
      })
      .catch(err => {
        console.error(err);
        message.error('删除到货记录失败');
      });
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

      const values = form.getFieldsValue();
      const arrivalDate: string = values.arrivalDate ? values.arrivalDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');
      const freightPerTon: number = values.freightPerTon || 0;
      const sellingPricePerTon: number = values.sellingPricePerTon || 0;
      const customerId: string = values.customerId || '';
      const customerName: string = customers.find(c => c.id === customerId)?.name || '';
      const remark: string = values.remark || '';

      const selectedShipmentData = availableShipments.filter(s => selectedShipments.includes(s.id));
      const relatedShipments = selectedShipmentData.map((s, idx) => {
        const arrivalWeight = arrivalWeights[s.id] ?? s.weight;
        const loss = s.weight - arrivalWeight;
        const receivableAmount = arrivalWeight * sellingPricePerTon;
        return {
          id: `as${Date.now()}_${idx}`,
          arrivalRecordId: editingRecord?.id || 'pending',
          shipmentId: s.id,
          plateNumber: s.plateNumber,
          driverName: s.driverName,
          originalWeight: s.weight,
          arrivalWeight,
          loss,
          receivableAmount
        };
      });

      const { totalArrivalWeight, totalLoss, totalFreightPayable, totalReceivable } = calculateTotals();

      const payload = {
        arrivalDate,
        customerId,
        customerName,
        sellingPricePerTon,
        freightPerTon,
        totalWeight: totalArrivalWeight,
        totalLoss,
        totalReceivable,
        actualFreightPaid: editingRecord?.actualFreightPaid || 0,
        freightPaymentStatus: editingRecord?.freightPaymentStatus || 'unpaid',
        actualReceived: editingRecord?.actualReceived || 0,
        receivablePaymentStatus: editingRecord?.receivablePaymentStatus || 'unpaid',
        status: editingRecord?.status || 'pending',
        remark,
        relatedShipments
      };

      if (editingRecord) {
        const updated = await arrivalRecordsService.update(editingRecord.id, payload);
        setArrivalRecords(prev => prev.map(r => r.id === editingRecord.id ? updated : r));
      } else {
        const created = await arrivalRecordsService.create(payload);
        setArrivalRecords(prev => [created, ...prev]);
      }

      message.success('到货记录已保存到后端');
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
                
                // 保存到后端
                paymentsService.createFreight({
                  driverId: newPayment.driverId,
                  driverName: newPayment.driverName,
                  plateNumbers: newPayment.plateNumbers || [],
                  calculatedAmount: newPayment.calculatedAmount,
                  actualAmount: newPayment.actualAmount,
                  paymentDate: newPayment.paymentDate,
                  remark: newPayment.remark,
                  arrivalRecordId: newPayment.arrivalRecordId
                }).then(created => {
                  setFreightPayments(prev => [...prev, created]);
                  freightPaymentForm.resetFields();
                  message.success('支付记录添加成功并已同步到付款管理');
                }).catch(err => {
                  console.error(err);
                  message.error('保存支付记录失败');
                });
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
                          
                          paymentsService.createFreight({
                            driverId: balancePayment.driverId,
                            driverName: balancePayment.driverName,
                            plateNumbers: balancePayment.plateNumbers || [],
                            calculatedAmount: balancePayment.calculatedAmount,
                            actualAmount: balancePayment.actualAmount,
                            paymentDate: balancePayment.paymentDate,
                            remark: balancePayment.remark,
                            arrivalRecordId: balancePayment.arrivalRecordId
                          }).then(created => {
                            setFreightPayments(prev => [...prev, created]);
                            message.success('平账结算完成，已同步到付款管理');
                          }).catch(err => {
                            console.error(err);
                            message.error('平账结算保存失败');
                          });
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
                  title: '实付金额',
                  dataIndex: 'actualAmount',
                  key: 'actualAmount',
                  render: (amount: number) => `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
                },
                {
                  title: '支付日期',
                  dataIndex: 'paymentDate',
                  key: 'paymentDate'
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
                        paymentsService.removeFreight(record.id)
                          .then(() => {
                            setFreightPayments(prev => prev.filter(p => p.id !== record.id));
                            message.success('支付记录删除成功并已同步到付款管理');
                          })
                          .catch(err => {
                            console.error(err);
                            message.error('删除支付记录失败');
                          });
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
          onFinish={async (values) => {
            try {
              const record = arrivalRecords.find(r => r.id === currentArrivalRecordId);
              if (!record) {
                message.error('未找到当前到货记录');
                return;
              }
              const actualReceived = Number(values.actualReceived || 0);
              const totalReceivable = Number(record.totalReceivable || 0);
              let receivablePaymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
              if (actualReceived >= totalReceivable) {
                receivablePaymentStatus = 'paid';
              } else if (actualReceived > 0) {
                receivablePaymentStatus = 'partial';
              }

              const updated = await arrivalRecordsService.update(record.id, {
                actualReceived,
                receivablePaymentStatus
              });
              setArrivalRecords(prev => prev.map(r => r.id === record.id ? updated : r));

              // 同步创建客户收款记录（付款管理页可见）
              try {
                await paymentsService.createCustomer({
                  customerId: record.customerId,
                  customerName: record.customerName,
                  amount: actualReceived,
                  paymentDate: values.receivedDate ? values.receivedDate.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
                  remark: values.remark || '',
                  arrivalRecordId: record.id
                });
              } catch (e) {
                console.warn('客户收款记录创建失败，但到货收款已更新:', e);
              }

              setIsReceivablePaymentVisible(false);
              message.success('收款记录已保存并同步到后端');
            } catch (err) {
              console.error(err);
              message.error('保存收款记录失败');
            }
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

      {/* 查看详情弹窗（含关联客户收款明细）*/}
      <Modal
        title="到货记录详情"
        open={isViewVisible}
        onCancel={() => {
          setIsViewVisible(false);
          setViewRecord(null);
          setCustomerPayments([]);
        }}
        width={900}
        footer={null}
      >
        {viewRecord && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}><div>到货日期：{dayjs(viewRecord.arrivalDate).format('YYYY-MM-DD')}</div></Col>
                <Col span={8}><div>客户：{viewRecord.customerName}</div></Col>
                <Col span={8}><div>车辆数：{viewRecord.relatedShipments.length}</div></Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}><div>总重量：{viewRecord.totalWeight.toFixed(2)} 吨</div></Col>
                <Col span={8}><div>总应收：¥{viewRecord.totalReceivable.toLocaleString()}</div></Col>
                <Col span={8}><div>已收：¥{(viewRecord.actualReceived || 0).toLocaleString()}</div></Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={8}><div>运费单价：¥{viewRecord.freightPerTon.toFixed(2)}/吨</div></Col>
                <Col span={8}><div>销售单价：¥{viewRecord.sellingPricePerTon.toFixed(2)}/吨</div></Col>
                <Col span={8}><div>备注：{viewRecord.remark || '-'}</div></Col>
              </Row>
            </Card>

            <Card title="关联车单明细表" style={{ marginBottom: 16 }}>
              <Table
                dataSource={viewRecord.relatedShipments}
                rowKey={(r) => r.id || r.shipmentId}
                pagination={false}
                columns={[
                  { title: '车牌号', dataIndex: 'plateNumber', key: 'plateNumber' },
                  { title: '司机', dataIndex: 'driverName', key: 'driverName' },
                  { title: '到货重量(吨)', dataIndex: 'arrivalWeight', key: 'arrivalWeight', render: (n: number) => Number(n || 0).toFixed(2) },
                  { title: '运损(吨)', dataIndex: 'loss', key: 'loss', render: (n: number) => (
                    <span style={{ color: (Number(n || 0) > 0) ? '#ff4d4f' : '#52c41a' }}>{Number(n || 0).toFixed(2)}</span>
                  ) },
                  { title: '应收金额(元)', dataIndex: 'receivableAmount', key: 'receivableAmount', render: (n: number) => `¥${Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}` },
                ]}
                summary={(pageData) => {
                  const totalArrival = pageData.reduce((sum, r) => sum + (Number(r.arrivalWeight) || 0), 0);
                  const totalLoss = pageData.reduce((sum, r) => sum + (Number(r.loss) || 0), 0);
                  const totalReceivable = pageData.reduce((sum, r) => sum + (Number(r.receivableAmount) || 0), 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}><strong>合计</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}><strong>{totalArrival.toFixed(2)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={2}><strong>{totalLoss.toFixed(2)}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={3}><strong>{`¥${totalReceivable.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`}</strong></Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>

            <Card title="关联客户收款明细" extra={<Tag color="blue">共 {customerPayments.length} 条</Tag>}>
              <Table
                dataSource={customerPayments}
                rowKey="id"
                pagination={false}
                columns={[
                  { title: '收款金额', dataIndex: 'amount', key: 'amount', render: (n: number) => `¥${Number(n).toFixed(2)}` },
                  { title: '收款日期', dataIndex: 'paymentDate', key: 'paymentDate' },
                  { title: '备注', dataIndex: 'remark', key: 'remark' },
                ]}
                summary={(pageData) => {
                  const total = pageData.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}><strong>总计</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={1}><strong>{`¥${total.toFixed(2)}`}</strong></Table.Summary.Cell>
                      <Table.Summary.Cell index={2} colSpan={2} />
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ArrivalRecords;
