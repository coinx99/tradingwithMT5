// AppHeader.tsx
import React, { type ReactNode } from 'react';
import { Layout, Flex, Button, Menu, Dropdown, Grid, Space } from 'antd';
import type { MenuProps } from 'antd';
import ThemeToggle from '../components/ThemeToggle';

import {
    GlobalOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
} from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface AppHeaderProps {
    /**
     * Trạng thái sidebar (collapsed/expanded)
     */
    collapsed?: boolean;

    /**
     * Callback khi nhấn nút toggle sidebar
     */
    onToggleCollapse?: () => void;

    /**
     * Trạng thái xác thực người dùng
     */
    isAuthenticated?: boolean;

    /**
     * Thông tin người dùng
     */
    user: {
        name?: string;
        email?: string;
        avatar?: string;
        role?: string;
    } | null;

    authItems: MenuProps['items'],

    /**
     * Số lượng thông báo chưa đọc
     */
    notifications?: number;

    /**
     * Danh sách mục điều hướng chính (cho Menu)
     */
    navItems?: MenuProps['items'];

    /**
     * Danh sách mục trong menu người dùng (dropdown)
     */
    userMenuItems?: MenuProps['items'];

    /**
     * Danh sách ngôn ngữ (cho dropdown)
     */
    languageItems?: MenuProps['items'];

    /**
     * Component logo tùy chỉnh (nếu cần)
     */
    logo?: ReactNode;

    /**
     * URL trang chủ (mặc định là "/")
     */
    homePath?: string;

    /**
     * Hiển thị nút toggle sidebar hay không
     */
    showCollapseButton?: boolean;

    /**
     * Hiển thị phần thông báo hay không
     */
    showNotifications?: boolean;

    /**
     * Hiển thị phần chọn ngôn ngữ hay không
     */
    showLanguageSelector?: boolean;
}

const { Header } = Layout;

const AppHeader: React.FC<AppHeaderProps> = ({
    collapsed = false,
    onToggleCollapse,
    isAuthenticated = false,
    user,
    authItems,
    navItems = [],
    userMenuItems = [],
    languageItems = [],
    logo = <h2 style={{ margin: 0, color: '#1890ff' }}>MyApp</h2>,
    homePath = '/',
    showCollapseButton = true,
    // notifications = 0,
    // showNotifications = true,
    // showLanguageSelector = true,
}) => {
    const { i18n } = useTranslation();
    const location = useLocation();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md; // md trở lên là desktop

    return (
        <Header
            style={{
                width: '100%',
                padding: '0 24px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
            }}
        >

            {/* Center: Logo + Navigation Menu */}
            <Flex
                align="center"
                justify="center"
                style={{ flex: 1, minWidth: 0, marginLeft: 24, marginRight: 24 }}
            >
                <Link to={homePath} style={{ textDecoration: 'none', marginRight: 32 }}>
                    {logo}
                </Link>

                <Menu
                    mode="horizontal"
                    selectedKeys={[location.pathname]}
                    items={navItems}
                    style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}
                />
            </Flex>

            {/* Right section - Actions */}
            <Flex align="center" gap="small" style={{ flex: '0 0 auto' }}>
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Language Selector */}
                <Dropdown
                    menu={{ items: languageItems }}
                    placement="bottomRight"
                    trigger={['click']}
                >
                    <Button type="text" icon={<GlobalOutlined />} className="hide-mobile">
                        <span className="hide-mobile">{i18n.language.toUpperCase()}</span>
                    </Button>
                </Dropdown>

                {/* User Menu or Auth Buttons */}
                <Flex>
                    {isAuthenticated ? (<>
                        <Dropdown
                            menu={{ items: userMenuItems }}
                            placement="bottomRight"
                            trigger={['hover']}
                        >
                            <Space style={{ cursor: 'pointer' }}>
                                <UserOutlined />
                                <span>{isMobile ? "" : user?.name || 'User'}</span>
                            </Space>
                        </Dropdown>
                    </>) : (<div>
                        <Dropdown menu={{ items: authItems }} placement="bottomRight" trigger={['hover']}>
                            <UserOutlined style={{ cursor: 'pointer' }} />
                        </Dropdown>

                    </div>)}
                </Flex>
            </Flex>

            {/* Right: Collapse Button */}
            {showCollapseButton && onToggleCollapse && (
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={onToggleCollapse}
                    style={{ flex: '0 0 auto' }}
                />
            )}
        </Header>
    );
};

export default AppHeader;

