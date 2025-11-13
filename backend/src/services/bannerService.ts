import { query } from '../config/database';

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  link_url?: string;
  bg_color: string;
  text_color: string;
  position: number;
  status: 'active' | 'inactive';
  start_date?: Date;
  end_date?: Date;
  created_at: Date;
  updated_at: Date;
}

/**
 * 获取所有横幅（支持分页和筛选）
 */
export const getAllBanners = async (params?: {
  page?: number;
  pageSize?: number;
  status?: string;
}) => {
  let whereClause = '';
  const queryParams: any[] = [];
  let paramCount = 0;

  if (params?.status && params.status !== 'all') {
    paramCount++;
    whereClause = `WHERE status = $${paramCount}`;
    queryParams.push(params.status);
  }

  // 获取总数
  const countResult = await query(
    `SELECT COUNT(*) FROM banners ${whereClause}`,
    queryParams
  );
  const total = parseInt(countResult.rows[0].count);

  // 分页
  const page = params?.page || 1;
  const pageSize = params?.pageSize || 10;
  const offset = (page - 1) * pageSize;

  // 获取数据
  const dataResult = await query(
    `SELECT * FROM banners ${whereClause} ORDER BY position, id LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
    [...queryParams, pageSize, offset]
  );

  return {
    data: dataResult.rows,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

/**
 * 获取所有激活的横幅（用于前端显示）
 */
export const getActiveBanners = async () => {
  const result = await query(
    `SELECT * FROM banners
     WHERE status = 'active'
     AND (start_date IS NULL OR start_date <= NOW())
     AND (end_date IS NULL OR end_date >= NOW())
     ORDER BY position`,
    []
  );
  return result.rows;
};

/**
 * 根据ID获取横幅
 */
export const getBannerById = async (id: number) => {
  const result = await query('SELECT * FROM banners WHERE id = $1', [id]);
  return result.rows[0] || null;
};

/**
 * 创建横幅
 */
export const createBanner = async (bannerData: Omit<Banner, 'id' | 'created_at' | 'updated_at'>) => {
  const result = await query(
    `INSERT INTO banners (title, subtitle, image_url, link_url, bg_color, text_color, position, status, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      bannerData.title,
      bannerData.subtitle || null,
      bannerData.image_url || null,
      bannerData.link_url || null,
      bannerData.bg_color || '#ff6b6b',
      bannerData.text_color || '#ffffff',
      bannerData.position || 0,
      bannerData.status || 'active',
      bannerData.start_date || null,
      bannerData.end_date || null,
    ]
  );
  return result.rows[0];
};

/**
 * 更新横幅
 */
export const updateBanner = async (id: number, bannerData: Partial<Banner>) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  Object.entries(bannerData).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
      paramCount++;
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    return null;
  }

  paramCount++;
  values.push(id);

  const result = await query(
    `UPDATE banners SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * 删除横幅
 */
export const deleteBanner = async (id: number) => {
  const result = await query('DELETE FROM banners WHERE id = $1 RETURNING id', [id]);
  return result.rowCount! > 0;
};

/**
 * 更新横幅位置
 */
export const updateBannerPosition = async (id: number, position: number) => {
  const result = await query(
    'UPDATE banners SET position = $1 WHERE id = $2 RETURNING *',
    [position, id]
  );
  return result.rows[0] || null;
};
