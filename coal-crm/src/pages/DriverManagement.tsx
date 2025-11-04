import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Space, 
  Popconfirm, 
  message,
  Card,
  Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Driver } from '../types';

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      name: '张师傅',
      phone: '13700137001',
      plateNumber: '京A12345',
      teamName: '顺达车队',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: '李师傅',
      phone: '13700137002',
      plateNumber: '京B67890',
      teamName: '快运车队',
      createdAt: '2024-01-02'
    },
    {
      id: '3',
      name: '王师傅',
      phone: '13700137003',
      plateNumber: '津C11111',
      createdAt: '2024-01-03'
    }
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '司机姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '车牌号',
      dataIndex: 'plateNumber',
      key: 'plateNumber',
      render: (plateNumber: string) => (
        <Tag color="blue">{plateNumber}</Tag>
      )
    },
    {
      title: '车队',
      dataIndex: 'teamName',
      key: 'teamName',
      render: (teamName: string) => (
        teamName ? <Tag color="green">{teamName}</Tag> : <Tag color="gray">个人</Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Driver) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个司机吗？"
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

  const handleAdd = () => {
    setEditingDriver(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver);
    form.setFieldsValue(driver);
    setIsModalVisible(true);
  };

  const handleDelete = (id: string) => {
    setDrivers(drivers.filter(driver => driver.id !== id));
    message.success('司机删除成功');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingDriver) {
        // 编辑司机
        setDrivers(drivers.map(driver => 
          driver.id === editingDriver.id 
            ? { ...driver, ...values }
            : driver
        ));
        message.success('司机信息更新成功');
      } else {
        // 新增司机
        const newDriver: Driver = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setDrivers([...drivers, newDriver]);
        message.success('司机添加成功');
      }
      
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingDriver(null);
  };

  return (
    <div>
      <Card 
        title="司机管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增司机
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={drivers}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingDriver ? '编辑司机' : '新增司机'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="driverForm"
        >
          <Form.Item
            name="name"
            label="司机姓名"
            rules={[{ required: true, message: '请输入司机姓名' }]}
          >
            <Input placeholder="请输入司机姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              {
                validator: (_: any, value: string) => {
                  if (!value) return Promise.resolve();
                  return /^1[3-9]\d{9}$/.test(value)
                    ? Promise.resolve()
                    : Promise.reject('请输入正确的手机号码');
                }
              }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          <Form.Item
            name="plateNumber"
            label="车牌号"
            rules={[
              { required: true, message: '请输入车牌号' },
              { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/, message: '请输入正确的车牌号' }
            ]}
          >
            <Input placeholder="请输入车牌号，如：京A12345" />
          </Form.Item>

          <Form.Item
            name="teamName"
            label="车队名称"
          >
            <Input placeholder="请输入车队名称（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DriverManagement;
