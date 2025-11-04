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
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Supplier } from '../types';
import { suppliersService } from '../services/suppliers';

const SupplierManagement: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const list = await suppliersService.list();
        setSuppliers(list);
      } catch (err) {
        console.error(err);
        message.error('加载供货方列表失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = [
    {
      title: '供货方名称',
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
      render: (_: any, record: Supplier) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个供货方吗？"
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
    setEditingSupplier(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await suppliersService.remove(id);
      setSuppliers(suppliers.filter(supplier => supplier.id !== id));
      message.success('供货方删除成功');
    } catch (err) {
      console.error(err);
      message.error('删除供货方失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingSupplier) {
        // 编辑供货方（后端）
        const updated = await suppliersService.update(editingSupplier.id, values);
        setSuppliers(suppliers.map(supplier => 
          supplier.id === editingSupplier.id 
            ? updated
            : supplier
        ));
        message.success('供货方信息更新成功');
      } else {
        // 新增供货方（后端）
        const created = await suppliersService.create(values);
        setSuppliers([...suppliers, created]);
        message.success('供货方添加成功');
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
    setEditingSupplier(null);
  };

  return (
    <div>
      <Card 
        title="供货方管理" 
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增供货方
          </Button>
        }
      >
        <Table 
          columns={columns} 
          dataSource={suppliers}
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
        title={editingSupplier ? '编辑供货方' : '新增供货方'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          name="supplierForm"
        >
          <Form.Item
            name="name"
            label="供货方名称"
            rules={[{ required: true, message: '请输入供货方名称' }]}
          >
            <Input placeholder="请输入供货方名称" />
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

export default SupplierManagement;
