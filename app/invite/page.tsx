'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import './invite.css'
import '../globals.css'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Invite() {
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [buttonState, setButtonState] = useState('initial')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Handle mouse movement for parallax effects
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const cards = document.querySelectorAll('.card');
    const floatingElements = document.querySelectorAll('.floating-element');
    
    // Update card highlighting
    cards.forEach(card => {
      const rect = (card as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
      (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
    });

    // Update floating elements position
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const moveX = (e.clientX - centerX) / 50;
    const moveY = (e.clientY - centerY) / 50;

    floatingElements.forEach((element, index) => {
      const depth = index + 1;
      (element as HTMLElement).style.transform = 
        `translate3d(${moveX * depth}px, ${moveY * depth}px, 0)`;
    });

    setMousePosition({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    // Initialize particles
    const particleContainer = document.querySelector('.particle-container');
    if (particleContainer) {
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particleContainer.appendChild(particle);
      }
    }

    // Add mouse move listener
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const isDark = tg.colorScheme === 'dark'
      setIsDarkMode(isDark)

      document.body.classList.toggle('dark-mode', isDark)

      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...initDataUnsafe.user, start_param: initDataUnsafe.start_param || null })
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data.user)
              setInviteLink(`http://t.me/miniappw21bot/cmos1/start?startapp=${data.user.telegramId}`)
              setInvitedUsers(data.user.invitedUsers || [])
            }
          })
          .catch(() => {
            setError('Failed to fetch user data')
          })
      } else {
        setError('No user data available')
      }
    } else {
      setError('This app should be opened in Telegram')
    }
  }, [])

  const handleInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        setButtonState('copied')
        setNotification('Invite link copied to clipboard!')
        
        // Trigger button animation
        const button = document.querySelector('.morphing-button');
        button?.classList.add('active');
        
        setTimeout(() => {
          setButtonState('fadeOut')
          button?.classList.remove('active');
          setTimeout(() => {
            setButtonState('initial')
            setNotification('')
          }, 300)
        }, 5000)
      }).catch(err => {
        console.error('Failed to copy: ', err)
        setNotification('Failed to copy invite link. Please try again.')
      })
    }
  }

  // Dynamic classes with animation states
  const containerClass = `container ${isDarkMode ? 'dark-mode' : ''}`
  const contentClass = `content custom-scrollbar ${isDarkMode ? 'dark-mode' : ''}`

  return (
    <div className={containerClass}>
      {/* Premium Background Effects */}
      <div className="nebula-background" />
      <div className="particle-container" />
      <div className="floating-elements">
        <div className="floating-element" />
        <div className="floating-element" />
        <div className="floating-element" />
      </div>

      <div className={contentClass}>
        {error ? (
          <div className="error glass-card">
            <span className="animated-text">{error}</span>
          </div>
        ) : !user ? (
          <div className="loader" />
        ) : (
          <>
            <div className="header card">
              <div className="iconContainer">
                <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </svg>
                <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </svg>
              </div>
              <p className="animated-text title">
                Invite your friends and earn Real Money!
              </p>
            </div>

            <button 
              onClick={handleInvite} 
              className="morphing-button"
            >
              <span className="button-content">
                <i className="fas fa-copy"></i> Copy Invite Link
              </span>
            </button>

            {user.invitedBy && (
              <div className="glass-card invitedBy">
                <span className="animated-text">Invited by: {user.invitedBy}</span>
              </div>
            )}

            <div className="card invitedSection">
              <div className="invitedHeader">
                <svg className="invitedIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="animated-text">
                  Invited Friends : {invitedUsers.length}
                </h2>
              </div>
              {invitedUsers.length > 0 ? (
                <ul className="invitedList">
                  {invitedUsers.map((user, index) => (
                    <li key={index} className="glass-card">
                      {user}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="emptyState glass-card">
                  <p className="animated-text">The Invite List is empty</p>
                </div>
              )}
            </div>

            {notification && (
              <div className="notification glass-card">
                <span className="animated-text">{notification}</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="footerContainer glass-card">
        <Link href="/">
          <a className="footerLink">
            <i className="fas fa-home"></i>
            <span>Home</span>
          </a>
        </Link>
        <Link href="/invite">
          <a className="footerLink activeFooterLink">
            <i className="fas fa-users"></i>
            <span>Friends</span>
          </a>
        </Link>
        <Link href="/leaderboard">
          <a className="footerLink">
            <i className="fas fa-trophy"></i>
            <span>Leaderboard</span>
          </a>
        </Link>
      </div>
    </div>
  )
}
