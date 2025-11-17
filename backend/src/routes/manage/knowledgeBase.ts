/**
 * 管理端 - 知识库管理路由
 */

import express from 'express';
import * as kbController from '../../controllers/webchat/knowledgeBaseController';

const router = express.Router();

// ==================== 知识分类 ====================

/**
 * @openapi
 * /api/manage/knowledge-base/categories:
 *   get:
 *     summary: 获取知识分类列表
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/categories', kbController.getCategories);

/**
 * @openapi
 * /api/manage/knowledge-base/categories:
 *   post:
 *     summary: 创建知识分类
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               parentId:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/categories', kbController.createCategory);

/**
 * @openapi
 * /api/manage/knowledge-base/categories/{id}:
 *   put:
 *     summary: 更新知识分类
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/categories/:id', kbController.updateCategory);

/**
 * @openapi
 * /api/manage/knowledge-base/categories/{id}:
 *   delete:
 *     summary: 删除知识分类
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/categories/:id', kbController.deleteCategory);

// ==================== 知识文档 ====================

/**
 * @openapi
 * /api/manage/knowledge-base/articles:
 *   get:
 *     summary: 获取知识文档列表
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/articles', kbController.getArticles);

/**
 * @openapi
 * /api/manage/knowledge-base/articles/{id}:
 *   get:
 *     summary: 获取知识文档详情
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/articles/:id', kbController.getArticleById);

/**
 * @openapi
 * /api/manage/knowledge-base/articles:
 *   post:
 *     summary: 创建知识文档
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               categoryId:
 *                 type: integer
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               summary:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublished:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/articles', kbController.createArticle);

/**
 * @openapi
 * /api/manage/knowledge-base/articles/{id}:
 *   put:
 *     summary: 更新知识文档
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/articles/:id', kbController.updateArticle);

/**
 * @openapi
 * /api/manage/knowledge-base/articles/{id}:
 *   delete:
 *     summary: 删除知识文档
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/articles/:id', kbController.deleteArticle);

// ==================== FAQ ====================

/**
 * @openapi
 * /api/manage/knowledge-base/faqs:
 *   get:
 *     summary: 获取FAQ列表
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/faqs', kbController.getFAQs);

/**
 * @openapi
 * /api/manage/knowledge-base/faqs:
 *   post:
 *     summary: 创建FAQ
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               categoryId:
 *                 type: integer
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isPublished:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/faqs', kbController.createFAQ);

/**
 * @openapi
 * /api/manage/knowledge-base/faqs/{id}:
 *   put:
 *     summary: 更新FAQ
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/faqs/:id', kbController.updateFAQ);

/**
 * @openapi
 * /api/manage/knowledge-base/faqs/{id}:
 *   delete:
 *     summary: 删除FAQ
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/faqs/:id', kbController.deleteFAQ);

// ==================== 搜索和统计 ====================

/**
 * @openapi
 * /api/manage/knowledge-base/search:
 *   get:
 *     summary: 搜索知识库
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/search', kbController.searchKnowledge);

/**
 * @openapi
 * /api/manage/knowledge-base/statistics:
 *   get:
 *     summary: 获取知识库统计
 *     tags: [Admin - Knowledge Base]
 *     security:
 *       - AdminBearerAuth: []
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/statistics', kbController.getStatistics);

export default router;
