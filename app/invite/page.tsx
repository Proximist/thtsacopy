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
  const [buttonState, setButtonState] = useState('initial')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse position for parallax effects
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const { clientX, clientY } = e
    const x = (clientX / window.innerWidth - 0.5) * 2
    const y = (clientY / window.innerHeight - 0.5) * 2
    setMousePosition({ x, y })

    // Update card hover effects
    const cards = document.querySelectorAll('.card')
    cards.forEach(card => {
      const rect = (card as HTMLElement).getBoundingClientRect()
      const cardX = clientX - rect.left
      const cardY = clientY - rect.top
      
      ;(card as HTMLElement).style.setProperty('--mouse-x', `${cardX}px`)
      ;(card as HTMLElement).style.setProperty('--mouse-y', `${cardY}px`)
    })
  }, [])

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

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
        setTimeout(() => {
          setButtonState('fadeOut')
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

  const containerClass = `container ${isDarkMode ? 'dark-mode' : ''}`
  const contentClass = `content ${isDarkMode ? 'dark-mode' : ''}`

  return (
    <div className={containerClass}>
      {/* Particle System */}
      <div className="particle-container">
        {[...Array(50)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Nebula Background */}
      <div className="nebula-background" />

      {/* Floating Elements with Parallax */}
      <div className="floating-elements">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="floating-element"
            style={{
              transform: `translate3d(${mousePosition.x * (i + 1) * 20}px, ${
                mousePosition.y * (i + 1) * 20
              }px, 0)`
            }}
          />
        ))}
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
              <p className="title animated-text">
                Invite your friends and earn Real Money!
              </p>
            </div>

            <button 
              onClick={handleInvite} 
              className={`morphing-button ${buttonState}`}
            >
              <span className="buttonContent">
                <i className="fas fa-copy"></i> Copy Invite Link
              </span>
            </button>

            {user.invitedBy && (
              <div className="invitedBy glass-card">
                <span className="animated-text">Invited by: {user.invitedBy}</span>
              </div>
            )}

            <div className="invitedSection card">
              <div className="invitedHeader">
                <svg className="invitedIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className="invitedTitle animated-text">
                  Invited Friends : {invitedUsers.length}
                </h2>
              </div>
              {invitedUsers.length > 0 ? (
                <ul className="invitedList">
                  {invitedUsers.map((user, index) => (
                    <li key={index} className="glass-card">
                      <span>{user}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="emptyState glass-card">
                  <p className="emptyStateText animated-text">The Invite List is empty</p>
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
