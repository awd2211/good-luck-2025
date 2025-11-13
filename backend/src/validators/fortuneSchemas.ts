import { z } from 'zod';

/**
 * 生肖运势请求验证
 */
export const birthFortuneSchema = z.object({
  birthYear: z.number()
    .int('年份必须是整数')
    .min(1900, '出生年份不能早于1900年')
    .max(2100, '出生年份不能晚于2100年'),
  birthMonth: z.number()
    .int('月份必须是整数')
    .min(1, '月份必须在1-12之间')
    .max(12, '月份必须在1-12之间'),
  birthDay: z.number()
    .int('日期必须是整数')
    .min(1, '日期必须在1-31之间')
    .max(31, '日期必须在1-31之间'),
  birthHour: z.number()
    .int('小时必须是整数')
    .min(0, '小时必须在0-23之间')
    .max(23, '小时必须在0-23之间')
    .optional()
});

/**
 * 八字精批请求验证
 */
export const baziSchema = z.object({
  birthYear: z.number()
    .int('年份必须是整数')
    .min(1900, '出生年份不能早于1900年')
    .max(2100, '出生年份不能晚于2100年'),
  birthMonth: z.number()
    .int('月份必须是整数')
    .min(1, '月份必须在1-12之间')
    .max(12, '月份必须在1-12之间'),
  birthDay: z.number()
    .int('日期必须是整数')
    .min(1, '日期必须在1-31之间')
    .max(31, '日期必须在1-31之间'),
  birthHour: z.number()
    .int('小时必须是整数')
    .min(0, '小时必须在0-23之间')
    .max(23, '小时必须在0-23之间'),
  gender: z.enum(['男', '女'], {
    message: '性别必须是"男"或"女"'
  })
});

/**
 * 流年运势请求验证
 */
export const flowYearSchema = z.object({
  birthYear: z.number()
    .int('年份必须是整数')
    .min(1900, '出生年份不能早于1900年')
    .max(2100, '出生年份不能晚于2100年'),
  targetYear: z.number()
    .int('年份必须是整数')
    .min(2000, '目标年份不能早于2000年')
    .max(2100, '目标年份不能晚于2100年')
});

/**
 * 姓名详批请求验证
 */
export const nameSchema = z.object({
  name: z.string()
    .min(2, '姓名至少2个字')
    .max(10, '姓名最多10个字')
    .regex(/^[\u4e00-\u9fa5]+$/, '姓名只能包含中文字符'),
  birthYear: z.number()
    .int('年份必须是整数')
    .min(1900, '出生年份不能早于1900年')
    .max(2100, '出生年份不能晚于2100年'),
  birthMonth: z.number()
    .int('月份必须是整数')
    .min(1, '月份必须在1-12之间')
    .max(12, '月份必须在1-12之间'),
  birthDay: z.number()
    .int('日期必须是整数')
    .min(1, '日期必须在1-31之间')
    .max(31, '日期必须在1-31之间')
});

/**
 * 婚姻分析请求验证
 */
export const marriageSchema = z.object({
  person1: z.object({
    name: z.string()
      .min(2, '姓名至少2个字')
      .max(10, '姓名最多10个字')
      .regex(/^[\u4e00-\u9fa5]+$/, '姓名只能包含中文字符'),
    birthYear: z.number()
      .int('年份必须是整数')
      .min(1900, '出生年份不能早于1900年')
      .max(2100, '出生年份不能晚于2100年'),
    birthMonth: z.number()
      .int('月份必须是整数')
      .min(1, '月份必须在1-12之间')
      .max(12, '月份必须在1-12之间'),
    birthDay: z.number()
      .int('日期必须是整数')
      .min(1, '日期必须在1-31之间')
      .max(31, '日期必须在1-31之间')
  }),
  person2: z.object({
    name: z.string()
      .min(2, '姓名至少2个字')
      .max(10, '姓名最多10个字')
      .regex(/^[\u4e00-\u9fa5]+$/, '姓名只能包含中文字符'),
    birthYear: z.number()
      .int('年份必须是整数')
      .min(1900, '出生年份不能早于1900年')
      .max(2100, '出生年份不能晚于2100年'),
    birthMonth: z.number()
      .int('月份必须是整数')
      .min(1, '月份必须在1-12之间')
      .max(12, '月份必须在1-12之间'),
    birthDay: z.number()
      .int('日期必须是整数')
      .min(1, '日期必须在1-31之间')
      .max(31, '日期必须在1-31之间')
  })
});

// 导出类型
export type BirthFortuneInput = z.infer<typeof birthFortuneSchema>;
export type BaziInput = z.infer<typeof baziSchema>;
export type FlowYearInput = z.infer<typeof flowYearSchema>;
export type NameInput = z.infer<typeof nameSchema>;
export type MarriageInput = z.infer<typeof marriageSchema>;
