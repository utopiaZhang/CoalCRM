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
  Card
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../types';
import { customersService } from '../services/customers';

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await customersService.list();
        setCustomers(list);
      } catch (err) {
        console.error(err);
        message.error('加载客户列表失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    {
      title: '客户名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '联系人',
      dataIndex: 'contact',
      key: 'contact',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Customer) => (
        <Space size="middle">
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
          <Popconfirm
            title="确定要删除这个客户吗？"
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
    setEditingCustomer(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleView = (customer: Customer) => {
    // 跳转到客户对账页面
    navigate(`/customers/${customer.id}/reconciliation`);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await customersService.remove(id);
      setCustomers(customers.filter(customer => customer.id !== id));
      message.success('客户删除成功');
    } catch (err) {
      console.error(err);
      message.error('删除客户失败');
    }
  };

const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingCustomer) {
        // 编辑客户（后端）
        const updated = await customersService.update(editingCustomer.id, { ...values, phone: values.phone ?? '' });
        setCustomers(customers.map(customer => 
          customer.id === editingCustomer.id 
            ? updated
            : customer
        ));
        message.success('客户信息更新成功');
      } else {
        // 新增客户（后端）
        const created = await customersService.create({ ...values, phone: values.phone ?? '' });
        setCustomers([...customers, created]);
        message.success('客户添加成功');
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
    setEditingCustomer(null);
  };

  return (
    <div>
      <Card 
        title="客户管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增客户
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingCustomer ? '编辑客户' : '新增客户'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="customerForm"
        >
          <Form.Item
            name="name"
            label="客户名称"
            rules={[{ required: true, message: '请输入客户名称' }]}
          >
            <Input placeholder="请输入客户名称" />
          </Form.Item>

          <Form.Item
            name="contact"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input placeholder="请输入联系人" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  return /^1[3-9]\d{9}$/.test(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('请输入正确的手机号码'));
                }
              }
            ]}
          >
            <Input placeholder="可不填" />
          </Form.Item>

          <Form.Item
            name="address"
            label="地址"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input.TextArea 
              placeholder="请输入地址" 
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerManagement;
