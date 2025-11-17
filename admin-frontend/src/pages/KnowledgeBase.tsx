import React, { useState, useEffect } from 'react';
import { Card, Tabs, Table, Button, Space, Modal, Form, Input, Select, Switch, Tag, Statistic, Row, Col, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, QuestionCircleOutlined, FolderOutlined, EyeOutlined, LikeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';
import apiService from '../services/api';

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string;
}

interface Article {
  id: number;
  category_id: number;
  title: string;
  content: string;
  summary: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
}

interface FAQ {
  id: number;
  category_id: number;
  question: string;
  answer: string;
  tags: string[];
  view_count: number;
  helpful_count: number;
  is_published: boolean;
  created_at: string;
}

const KnowledgeBase: React.FC = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [loading, setLoading] = useState(false);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleModalVisible, setArticleModalVisible] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articlePagination, setArticlePagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // FAQs
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqModalVisible, setFaqModalVisible] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqPagination, setFaqPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  // Statistics
  const [statistics, setStatistics] = useState<any>(null);

  const [categoryForm] = Form.useForm();
  const [articleForm] = Form.useForm();
  const [faqForm] = Form.useForm();

  useEffect(() => {
    fetchStatistics();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'articles') fetchArticles();
    if (activeTab === 'faqs') fetchFAQs();
  }, [activeTab]);

  const fetchStatistics = async () => {
    try {
      const response = await apiService.get('/knowledge-base/statistics');
      setStatistics(response.data.data || {});
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/knowledge-base/categories');
      setCategories(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      message.error('获取分类失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/knowledge-base/articles', {
        params: {
          page: articlePagination.current,
          limit: articlePagination.pageSize
        }
      });
      setArticles(Array.isArray(response.data.data) ? response.data.data : []);
      setArticlePagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }));
    } catch (error) {
      message.error('获取文档失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/knowledge-base/faqs', {
        params: {
          page: faqPagination.current,
          limit: faqPagination.pageSize
        }
      });
      setFaqs(Array.isArray(response.data.data) ? response.data.data : []);
      setFaqPagination(prev => ({ ...prev, total: response.data.pagination?.total || 0 }));
    } catch (error) {
      message.error('获取FAQ失败');
    } finally {
      setLoading(false);
    }
  };

  // Category handlers
  const handleCreateCategory = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.setFieldsValue(category);
    setCategoryModalVisible(true);
  };

  const handleCategorySubmit = async () => {
    try {
      const values = await categoryForm.validateFields();
      if (editingCategory) {
        await apiService.put(`/knowledge-base/categories/${editingCategory.id}`, values);
        message.success('更新成功');
      } else {
        await apiService.post('/knowledge-base/categories', values);
        message.success('创建成功');
      }
      setCategoryModalVisible(false);
      fetchCategories();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteCategory = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除分类会影响相关的文档和FAQ，确定要删除吗？',
      onOk: async () => {
        try {
          await apiService.delete(`/knowledge-base/categories/${id}`);
          message.success('删除成功');
          fetchCategories();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // Article handlers
  const handleCreateArticle = () => {
    setEditingArticle(null);
    articleForm.resetFields();
    setArticleModalVisible(true);
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
    articleForm.setFieldsValue(article);
    setArticleModalVisible(true);
  };

  const handleArticleSubmit = async () => {
    try {
      const values = await articleForm.validateFields();
      if (editingArticle) {
        await apiService.put(`/knowledge-base/articles/${editingArticle.id}`, values);
        message.success('更新成功');
      } else {
        await apiService.post('/knowledge-base/articles', values);
        message.success('创建成功');
      }
      setArticleModalVisible(false);
      fetchArticles();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteArticle = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这篇文档吗？',
      onOk: async () => {
        try {
          await apiService.delete(`/knowledge-base/articles/${id}`);
          message.success('删除成功');
          fetchArticles();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  // FAQ handlers
  const handleCreateFAQ = () => {
    setEditingFaq(null);
    faqForm.resetFields();
    setFaqModalVisible(true);
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFaq(faq);
    faqForm.setFieldsValue(faq);
    setFaqModalVisible(true);
  };

  const handleFAQSubmit = async () => {
    try {
      const values = await faqForm.validateFields();
      if (editingFaq) {
        await apiService.put(`/knowledge-base/faqs/${editingFaq.id}`, values);
        message.success('更新成功');
      } else {
        await apiService.post('/knowledge-base/faqs', values);
        message.success('创建成功');
      }
      setFaqModalVisible(false);
      fetchFAQs();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleDeleteFAQ = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个FAQ吗？',
      onOk: async () => {
        try {
          await apiService.delete(`/knowledge-base/faqs/${id}`);
          message.success('删除成功');
          fetchFAQs();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const categoryColumns: ColumnsType<Category> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    { title: '图标', dataIndex: 'icon', width: 80, render: (icon) => <span style={{ fontSize: 24 }}>{icon || '📁'}</span> },
    {
      title: '分类名称',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name, 'zh-CN'),
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      sorter: (a, b) => (a.description || '').localeCompare(b.description || '', 'zh-CN'),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 100,
      render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? '启用' : '禁用'}</Tag>,
      sorter: (a, b) => Number(a.is_active) - Number(b.is_active),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditCategory(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  const articleColumns: ColumnsType<Article> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true,
      sorter: (a, b) => a.title.localeCompare(b.title, 'zh-CN'),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      ellipsis: true,
      sorter: (a, b) => (a.summary || '').localeCompare(b.summary || '', 'zh-CN'),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 200,
      render: (tags: string[]) => tags?.map(tag => <Tag key={tag}>{tag}</Tag>)
    },
    {
      title: '浏览',
      dataIndex: 'view_count',
      width: 80,
      render: (count) => <><EyeOutlined /> {count}</>,
      sorter: (a, b) => a.view_count - b.view_count,
    },
    {
      title: '有用',
      dataIndex: 'helpful_count',
      width: 80,
      render: (count) => <><LikeOutlined /> {count}</>,
      sorter: (a, b) => a.helpful_count - b.helpful_count,
    },
    {
      title: '状态',
      width: 120,
      render: (_, record) => (
        <>
          {record.is_published && <Tag color="green">已发布</Tag>}
          {record.is_featured && <Tag color="gold">精选</Tag>}
        </>
      )
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditArticle(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteArticle(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  const faqColumns: ColumnsType<FAQ> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: '问题',
      dataIndex: 'question',
      ellipsis: true,
      sorter: (a, b) => a.question.localeCompare(b.question, 'zh-CN'),
    },
    {
      title: '回答',
      dataIndex: 'answer',
      ellipsis: true,
      sorter: (a, b) => a.answer.localeCompare(b.answer, 'zh-CN'),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 150,
      render: (tags: string[]) => tags?.map(tag => <Tag key={tag}>{tag}</Tag>)
    },
    {
      title: '浏览',
      dataIndex: 'view_count',
      width: 80,
      sorter: (a, b) => a.view_count - b.view_count,
    },
    {
      title: '发布',
      dataIndex: 'is_published',
      width: 80,
      render: (published) => <Tag color={published ? 'green' : 'default'}>{published ? '是' : '否'}</Tag>,
      sorter: (a, b) => Number(a.is_published) - Number(b.is_published),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditFAQ(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteFAQ(record.id)}>删除</Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <h2>知识库管理</h2>

      {statistics && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card><Statistic title="分类总数" value={statistics.totalCategories} prefix={<FolderOutlined />} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="文档总数" value={statistics.totalArticles} prefix={<BookOutlined />} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="FAQ总数" value={statistics.totalFAQs} prefix={<QuestionCircleOutlined />} /></Card>
          </Col>
          <Col span={6}>
            <Card><Statistic title="总浏览量" value={statistics.totalViews} prefix={<EyeOutlined />} /></Card>
          </Col>
        </Row>
      )}

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><FolderOutlined />知识分类</span>} key="categories">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateCategory} style={{ marginBottom: 16 }}>
              新建分类
            </Button>
            <Table columns={categoryColumns} dataSource={categories} rowKey="id" loading={loading} />
          </TabPane>

          <TabPane tab={<span><BookOutlined />知识文档</span>} key="articles">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateArticle} style={{ marginBottom: 16 }}>
              新建文档
            </Button>
            <Table
              columns={articleColumns}
              dataSource={articles}
              rowKey="id"
              loading={loading}
              pagination={{
                current: articlePagination.current,
                pageSize: articlePagination.pageSize,
                total: articlePagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setArticlePagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }))
              }}
            />
          </TabPane>

          <TabPane tab={<span><QuestionCircleOutlined />常见问题</span>} key="faqs">
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateFAQ} style={{ marginBottom: 16 }}>
              新建FAQ
            </Button>
            <Table
              columns={faqColumns}
              dataSource={faqs}
              rowKey="id"
              loading={loading}
              pagination={{
                current: faqPagination.current,
                pageSize: faqPagination.pageSize,
                total: faqPagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setFaqPagination(prev => ({ ...prev, current: page, pageSize: pageSize || 20 }))
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Category Modal */}
      <Modal
        title={editingCategory ? '编辑分类' : '新建分类'}
        open={categoryModalVisible}
        onOk={handleCategorySubmit}
        onCancel={() => setCategoryModalVisible(false)}
        width={600}
      >
        <Form form={categoryForm} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="输入emoji或图标" />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Article Modal */}
      <Modal
        title={editingArticle ? '编辑文档' : '新建文档'}
        open={articleModalVisible}
        onOk={handleArticleSubmit}
        onCancel={() => setArticleModalVisible(false)}
        width={900}
      >
        <Form form={articleForm} layout="vertical">
          <Form.Item name="categoryId" label="分类">
            <Select>
              {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <SunEditor
              height="300"
              setOptions={{
                buttonList: [
                  ['undo', 'redo'],
                  ['bold', 'underline', 'italic', 'strike'],
                  ['fontColor', 'hiliteColor'],
                  ['removeFormat'],
                  ['outdent', 'indent'],
                  ['align', 'horizontalRule', 'list', 'lineHeight'],
                  ['table', 'link', 'image'],
                  ['fullScreen', 'showBlocks', 'codeView']
                ]
              }}
            />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签按回车添加" />
          </Form.Item>
          <Form.Item name="isPublished" label="发布" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isFeatured" label="精选" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* FAQ Modal */}
      <Modal
        title={editingFaq ? '编辑FAQ' : '新建FAQ'}
        open={faqModalVisible}
        onOk={handleFAQSubmit}
        onCancel={() => setFaqModalVisible(false)}
        width={700}
      >
        <Form form={faqForm} layout="vertical">
          <Form.Item name="categoryId" label="分类">
            <Select>
              {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="question" label="问题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="answer" label="回答" rules={[{ required: true }]}>
            <TextArea rows={5} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签按回车添加" />
          </Form.Item>
          <Form.Item name="isPublished" label="发布" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase;
