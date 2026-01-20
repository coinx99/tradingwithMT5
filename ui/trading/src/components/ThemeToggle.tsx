import React from 'react';
import { Button, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface ThemeToggleProps {
  size?: 'small' | 'middle' | 'large';
  type?: 'default' | 'primary' | 'text' | 'link' | 'dashed';
  iconOnly?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'middle', 
  type = 'text',
  iconOnly = true 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  
  const isDark = theme === 'dark';
  
  const tooltipTitle = isDark 
    ? t('common.switchToLight') || 'Switch to Light Mode'
    : t('common.switchToDark') || 'Switch to Dark Mode';

  return (
    <Tooltip title={tooltipTitle} placement="bottom">
      <Button
        type={type}
        size={size}
        icon={isDark ? <SunOutlined /> : <MoonOutlined />}
        onClick={toggleTheme}
        className="theme-toggle-btn"
        aria-label={tooltipTitle}
      >
        {!iconOnly && (isDark ? t('common.lightMode') : t('common.darkMode'))}
      </Button>
    </Tooltip>
  );
};

export default ThemeToggle;