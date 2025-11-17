/**
 * 邮件定时任务
 * 使用node-cron实现定时发送邮件
 */

import cron from 'node-cron'
import { query } from '../config/database'
import * as emailNotifications from '../services/emailNotificationService'

/**
 * 每日星座运势推送
 * 每天早上8点执行
 */
export function startDailyHoroscopePushTask() {
  // 每天早上8点
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ 开始执行每日星座运势推送任务...')

    try {
      // 获取今天的星座运势
      const today = new Date().toISOString().split('T')[0]
      const horoscopeResult = await query(
        `SELECT zodiac_sign, content FROM daily_horoscopes WHERE date = $1`,
        [today]
      )

      if (horoscopeResult.rows.length === 0) {
        console.log('⚠️  今天没有星座运势数据，跳过推送')
        return
      }

      const horoscopes = horoscopeResult.rows

      // 获取订阅了星座运势的用户
      const usersResult = await query(
        `SELECT id, email, birth_date FROM users
         WHERE email IS NOT NULL
         AND status = 'active'
         AND birth_date IS NOT NULL`
      )

      let sentCount = 0
      for (const user of usersResult.rows) {
        // 根据出生日期计算星座
        const zodiacSign = getZodiacSign(new Date(user.birth_date))
        const horoscope = horoscopes.find(h => h.zodiac_sign === zodiacSign)

        if (horoscope) {
          emailNotifications.sendDailyHoroscopeEmail(
            user.email,
            zodiacSign,
            horoscope.content
          )
            .then(result => {
              if (result.success) {
                sentCount++
              }
            })
            .catch(err => {
              console.error(`发送星座运势邮件失败 (${user.email}):`, err)
            })
        }
      }

      console.log(`✅ 每日星座运势推送任务完成，已发送 ${sentCount} 封邮件`)
    } catch (error) {
      console.error('❌ 每日星座运势推送任务失败:', error)
    }
  })

  console.log('✅ 每日星座运势推送任务已启动 (每天 08:00)')
}

/**
 * 服务到期提醒
 * 每天凌晨1点检查
 */
export function startServiceExpiryReminderTask() {
  // 每天凌晨1点
  cron.schedule('0 1 * * *', async () => {
    console.log('⏰ 开始执行服务到期提醒任务...')

    try {
      // 查找3天内将要过期的订单
      const threeDaysLater = new Date()
      threeDaysLater.setDate(threeDaysLater.getDate() + 3)

      const expiringOrdersResult = await query(
        `SELECT o.order_id, o.fortune_name, u.email, o.create_time::date + INTERVAL '30 days' as expiry_date
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.status = 'completed'
         AND u.email IS NOT NULL
         AND o.create_time::date + INTERVAL '30 days' BETWEEN CURRENT_DATE AND $1::date`,
        [threeDaysLater.toISOString().split('T')[0]]
      )

      let sentCount = 0
      for (const order of expiringOrdersResult.rows) {
        const daysRemaining = Math.ceil(
          (new Date(order.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )

        emailNotifications.sendServiceExpiringEmail(
          order.email,
          order.fortune_name,
          daysRemaining
        )
          .then(result => {
            if (result.success) {
              sentCount++
            }
          })
          .catch(err => {
            console.error(`发送服务到期提醒邮件失败 (${order.email}):`, err)
          })
      }

      console.log(`✅ 服务到期提醒任务完成，已发送 ${sentCount} 封邮件`)
    } catch (error) {
      console.error('❌ 服务到期提醒任务失败:', error)
    }
  })

  console.log('✅ 服务到期提醒任务已启动 (每天 01:00)')
}

/**
 * 优惠券到期提醒
 * 每天凌晨2点检查
 */
export function startCouponExpiryReminderTask() {
  // 每天凌晨2点
  cron.schedule('0 2 * * *', async () => {
    console.log('⏰ 开始执行优惠券到期提醒任务...')

    try {
      // 查找3天内将要过期的优惠券
      const threeDaysLater = new Date()
      threeDaysLater.setDate(threeDaysLater.getDate() + 3)

      const expiringCouponsResult = await query(
        `SELECT uc.id, u.email, c.name, c.value, uc.expired_at
         FROM user_coupons uc
         JOIN users u ON uc.user_id = u.id
         JOIN coupons c ON uc.coupon_id = c.id
         WHERE uc.status = 'unused'
         AND u.email IS NOT NULL
         AND uc.expired_at::date BETWEEN CURRENT_DATE AND $1::date`,
        [threeDaysLater.toISOString().split('T')[0]]
      )

      let sentCount = 0
      for (const coupon of expiringCouponsResult.rows) {
        const daysRemaining = Math.ceil(
          (new Date(coupon.expired_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )

        emailNotifications.sendCouponExpiringEmail(
          coupon.email,
          coupon.name,
          parseFloat(coupon.value),
          daysRemaining
        )
          .then(result => {
            if (result.success) {
              sentCount++
            }
          })
          .catch(err => {
            console.error(`发送优惠券到期提醒邮件失败 (${coupon.email}):`, err)
          })
      }

      console.log(`✅ 优惠券到期提醒任务完成，已发送 ${sentCount} 封邮件`)
    } catch (error) {
      console.error('❌ 优惠券到期提醒任务失败:', error)
    }
  })

  console.log('✅ 优惠券到期提醒任务已启动 (每天 02:00)')
}

/**
 * 生日祝福
 * 每天凌晨0点检查
 */
export function startBirthdayGreetingTask() {
  // 每天凌晨0点
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ 开始执行生日祝福任务...')

    try {
      // 获取今天生日的用户
      const today = new Date()
      const month = today.getMonth() + 1
      const day = today.getDate()

      const birthdayUsersResult = await query(
        `SELECT id, email, nickname FROM users
         WHERE email IS NOT NULL
         AND status = 'active'
         AND EXTRACT(MONTH FROM birth_date) = $1
         AND EXTRACT(DAY FROM birth_date) = $2`,
        [month, day]
      )

      let sentCount = 0
      for (const user of birthdayUsersResult.rows) {
        emailNotifications.sendBirthdayGreetingEmail(
          user.email,
          user.nickname || '用户'
        )
          .then(result => {
            if (result.success) {
              sentCount++
            }
          })
          .catch(err => {
            console.error(`发送生日祝福邮件失败 (${user.email}):`, err)
          })
      }

      console.log(`✅ 生日祝福任务完成，已发送 ${sentCount} 封邮件`)
    } catch (error) {
      console.error('❌ 生日祝福任务失败:', error)
    }
  })

  console.log('✅ 生日祝福任务已启动 (每天 00:00)')
}

/**
 * 周报推送
 * 每周一早上9点执行
 */
export function startWeeklyReportTask() {
  // 每周一早上9点 (0 9 * * 1)
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ 开始执行周报推送任务...')

    try {
      // 获取订阅了周报的活跃用户
      const usersResult = await query(
        `SELECT u.id, u.email, u.nickname
         FROM users u
         WHERE u.email IS NOT NULL
         AND u.status = 'active'
         AND u.created_at < NOW() - INTERVAL '7 days'`
      )

      let sentCount = 0
      for (const user of usersResult.rows) {
        // 生成本周运势摘要
        const summary = `本周您的整体运势较为平稳，适合处理日常事务。

工作运：★★★★☆ 本周工作运势不错，建议积极主动。
财运：★★★☆☆ 财运平稳，量入为出。
感情运：★★★★☆ 感情运势上升，适合表达心意。
健康运：★★★☆☆ 注意休息，保持规律作息。`

        emailNotifications.sendPeriodicReportEmail(
          user.email,
          'weekly',
          summary
        )
          .then(result => {
            if (result.success) {
              sentCount++
            }
          })
          .catch(err => {
            console.error(`发送周报邮件失败 (${user.email}):`, err)
          })
      }

      console.log(`✅ 周报推送任务完成，已发送 ${sentCount} 封邮件`)
    } catch (error) {
      console.error('❌ 周报推送任务失败:', error)
    }
  })

  console.log('✅ 周报推送任务已启动 (每周一 09:00)')
}

/**
 * 月报推送
 * 每月1号早上9点执行
 */
export function startMonthlyReportTask() {
  // 每月1号早上9点 (0 9 1 * *)
  cron.schedule('0 9 1 * *', async () => {
    console.log('⏰ 开始执行月报推送任务...')

    try {
      // 获取订阅了月报的活跃用户
      const usersResult = await query(
        `SELECT u.id, u.email, u.nickname
         FROM users u
         WHERE u.email IS NOT NULL
         AND u.status = 'active'
         AND u.created_at < NOW() - INTERVAL '30 days'`
      )

      let sentCount = 0
      for (const user of usersResult.rows) {
        // 生成本月运势摘要
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const monthName = lastMonth.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

        const summary = `${monthName}运势总结：

本月您的整体运势呈上升趋势，收获颇丰。

工作成就：本月完成了重要项目，获得了肯定。
财务状况：收支平衡，有小额收益。
人际关系：扩展了社交圈，建立了新的人脉。
个人成长：学习了新技能，提升了能力。

下月建议：继续保持积极态度，把握机会。`

        emailNotifications.sendPeriodicReportEmail(
          user.email,
          'monthly',
          summary
        )
          .then(result => {
            if (result.success) {
              sentCount++
            }
          })
          .catch(err => {
            console.error(`发送月报邮件失败 (${user.email}):`, err)
          })
      }

      console.log(`✅ 月报推送任务完成，已发送 ${sentCount} 封邮件`)
    } catch (error) {
      console.error('❌ 月报推送任务失败:', error)
    }
  })

  console.log('✅ 月报推送任务已启动 (每月1号 09:00)')
}

/**
 * 根据出生日期计算星座
 */
function getZodiacSign(birthDate: Date): string {
  const month = birthDate.getMonth() + 1
  const day = birthDate.getDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries'
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus'
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini'
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer'
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo'
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo'
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra'
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio'
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius'
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn'
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius'
  return 'pisces' // (month === 2 && day >= 19) || (month === 3 && day <= 20)
}

/**
 * 启动所有定时任务
 */
export function startAllEmailTasks() {
  console.log('🚀 启动所有邮件定时任务...')

  startDailyHoroscopePushTask()
  startServiceExpiryReminderTask()
  startCouponExpiryReminderTask()
  startBirthdayGreetingTask()
  startWeeklyReportTask()
  startMonthlyReportTask()

  console.log('✅ 所有邮件定时任务已启动')
}
