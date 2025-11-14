#!/bin/bash

# PM2 管理脚本 - 管理所有服务

ECOSYSTEM_FILE="ecosystem.config.js"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo "用法: ./pm2.sh [命令]"
    echo ""
    echo "命令:"
    echo "  start           启动所有服务"
    echo "  stop            停止所有服务"
    echo "  restart         重启所有服务"
    echo "  reload          零停机重载所有服务"
    echo "  status          查看服务状态"
    echo "  logs            查看所有日志"
    echo "  logs-backend    查看后端日志"
    echo "  logs-frontend   查看用户前端日志"
    echo "  logs-admin      查看管理后台日志"
    echo "  monit           监控面板"
    echo "  delete          删除所有服务"
    echo "  save            保存当前进程列表"
    echo "  startup         设置开机自启动"
    echo "  unstartup       取消开机自启动"
    echo "  update          更新PM2"
    echo ""
    echo "示例:"
    echo "  ./pm2.sh start      # 启动所有服务"
    echo "  ./pm2.sh logs       # 查看所有日志"
    echo "  ./pm2.sh status     # 查看状态"
}

# 检查是否已构建
check_build() {
    if [ ! -d "backend/dist" ]; then
        echo -e "${RED}错误: 后端未构建，请先运行 ./build.sh${NC}"
        exit 1
    fi
    if [ ! -d "frontend/dist" ]; then
        echo -e "${RED}错误: 用户前端未构建，请先运行 ./build.sh${NC}"
        exit 1
    fi
    if [ ! -d "admin-frontend/dist" ]; then
        echo -e "${RED}错误: 管理后台未构建，请先运行 ./build.sh${NC}"
        exit 1
    fi
}

# 启动服务
start_services() {
    echo -e "${GREEN}=========================================${NC}"
    echo -e "${GREEN}启动所有服务...${NC}"
    echo -e "${GREEN}=========================================${NC}"

    check_build

    pm2 start $ECOSYSTEM_FILE

    echo ""
    echo -e "${GREEN}✓ 所有服务已启动${NC}"
    echo ""
    pm2 status

    echo ""
    echo -e "${YELLOW}提示: 运行 ./pm2.sh save 保存进程列表${NC}"
    echo -e "${YELLOW}提示: 运行 ./pm2.sh startup 设置开机自启动${NC}"
}

# 停止服务
stop_services() {
    echo -e "${YELLOW}停止所有服务...${NC}"
    pm2 stop $ECOSYSTEM_FILE
    echo -e "${GREEN}✓ 所有服务已停止${NC}"
}

# 重启服务
restart_services() {
    echo -e "${YELLOW}重启所有服务...${NC}"
    pm2 restart $ECOSYSTEM_FILE
    echo -e "${GREEN}✓ 所有服务已重启${NC}"
}

# 零停机重载
reload_services() {
    echo -e "${YELLOW}零停机重载所有服务...${NC}"
    pm2 reload $ECOSYSTEM_FILE
    echo -e "${GREEN}✓ 所有服务已重载${NC}"
}

# 查看状态
show_status() {
    pm2 status
}

# 查看日志
show_logs() {
    pm2 logs
}

# 查看后端日志
show_backend_logs() {
    pm2 logs backend-api
}

# 查看用户前端日志
show_frontend_logs() {
    pm2 logs frontend-user
}

# 查看管理后台日志
show_admin_logs() {
    pm2 logs frontend-admin
}

# 监控面板
show_monit() {
    pm2 monit
}

# 删除服务
delete_services() {
    echo -e "${RED}删除所有服务...${NC}"
    pm2 delete $ECOSYSTEM_FILE
    echo -e "${GREEN}✓ 所有服务已删除${NC}"
}

# 保存进程列表
save_process() {
    pm2 save
    echo -e "${GREEN}✓ 进程列表已保存${NC}"
}

# 设置开机自启动
setup_startup() {
    echo -e "${GREEN}设置开机自启动...${NC}"
    pm2 startup
    echo ""
    echo -e "${YELLOW}请按照上面的提示执行命令（需要sudo权限）${NC}"
    echo -e "${YELLOW}然后运行 ./pm2.sh save 保存当前进程列表${NC}"
}

# 取消开机自启动
unstartup() {
    pm2 unstartup
    echo -e "${GREEN}✓ 已取消开机自启动${NC}"
}

# 更新PM2
update_pm2() {
    echo -e "${YELLOW}更新PM2...${NC}"
    pm2 update
    echo -e "${GREEN}✓ PM2已更新${NC}"
}

# 主逻辑
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    reload)
        reload_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-backend)
        show_backend_logs
        ;;
    logs-frontend)
        show_frontend_logs
        ;;
    logs-admin)
        show_admin_logs
        ;;
    monit)
        show_monit
        ;;
    delete)
        delete_services
        ;;
    save)
        save_process
        ;;
    startup)
        setup_startup
        ;;
    unstartup)
        unstartup
        ;;
    update)
        update_pm2
        ;;
    *)
        show_help
        exit 0
        ;;
esac
