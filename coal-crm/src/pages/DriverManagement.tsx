import React, { useEffect, useState } from 'react';
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
import { driversService, DriverSummary } from '../services/drivers';

const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<DriverSummary[]>([]);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DriverSummary | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try {
        const list = await driversService.list();
        setDrivers(list);
      } catch (e) {
        console.error(e);
        message.error('加载司机列表失败');
      }
    })();
  }, []);

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
      dataIndex: 'plateNumbers',
      key: 'plateNumbers',
      render: (plateNumbers: string[]) => (
        <div>
          {(plateNumbers || []).map(p => (
            <Tag key={p} color="blue">{p}</Tag>
          ))}
        </div>
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
      render: (_: any, record: DriverSummary) => (
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

  const handleEdit = (driver: DriverSummary) => {
    setEditingDriver(driver);
    form.setFieldsValue({
      name: driver.name,
      phone: driver.phone,
      teamName: driver.teamName || '',
      plateNumbers: (driver.plateNumbers || []).join(', ')
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await driversService.remove(id);
      setDrivers(drivers.filter(driver => driver.id !== id));
      message.success('司机删除成功');
    } catch (e) {
      console.error(e);
      message.error('司机删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        name: values.name,
        phone: values.phone || '',
        teamName: values.teamName || '',
        plateNumbers: (values.plateNumbers || '')
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0)
      };

      if (editingDriver) {
        const updated = await driversService.update(editingDriver.id, payload);
        setDrivers(drivers.map(d => (d.id === editingDriver.id ? updated : d)));
        message.success('司机信息更新成功');
      } else {
        const created = await driversService.create(payload);
        setDrivers([created, ...drivers]);
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
            name="plateNumbers"
            label="车牌号（多个用逗号分隔）"
            rules={[{ required: true, message: '请输入至少一个车牌号' }]}
          >
            <Input placeholder="例如：京A12345, 京B67890" />
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
