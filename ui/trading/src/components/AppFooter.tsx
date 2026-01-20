import React from 'react';
import { Layout } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Footer } = Layout;

const AppFooter: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Footer className="app-footer">
      <div className="footer-content">
        <p className="footer-text">
          Dashboard App ©2025. {t('common.welcome')} to our platform!
        </p>

        <div className="footer-links">
          <Link to="/home" className="footer-link">
            {t('navigation.home')}
          </Link>
          <span className="footer-divider">|</span>
          <Link to="/about" className="footer-link">
            {t('navigation.about')}
          </Link>
          <span className="footer-divider">|</span>
          <Link to="/contact" className="footer-link">
            {t('navigation.contact')}
          </Link>
        </div>
        
      </div>
    </Footer>
  );
};

export default AppFooter;