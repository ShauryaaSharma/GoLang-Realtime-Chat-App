import React from 'react';
import './Header.scss';

const Header = ({ username, level, xpProgress, messageCount, connectionStatus }) => {
  const statusLabel = {
    connected: 'ONLINE',
    disconnected: 'OFFLINE',
    error: 'ERROR',
  }[connectionStatus] || 'CONNECTING';

  return (
    <div className='header'>
      <div className='header-left'>
        <div className='logo'>
          <span className='logo-bracket'>[</span>
          NEXUS
          <span className='logo-bracket'>]</span>
        </div>
        <div className={`status-dot ${connectionStatus}`} />
        <span className={`status-label ${connectionStatus}`}>{statusLabel}</span>
      </div>

      <div className='header-center'>
        <div className='xp-bar-wrap'>
          <span className='level-badge'>LVL {level}</span>
          <div className='xp-bar'>
            <div className='xp-fill' style={{ width: `${xpProgress}%` }} />
          </div>
          <span className='xp-label'>{xpProgress}/100 XP</span>
        </div>
      </div>

      <div className='header-right'>
        <div className='stat-block'>
          <span className='stat-value'>{messageCount}</span>
          <span className='stat-name'>MSGS</span>
        </div>
        <div className='player-tag'>
          <span className='player-icon'>◈</span>
          <span className='player-name'>{username}</span>
        </div>
      </div>
    </div>
  );
};

export default Header;
