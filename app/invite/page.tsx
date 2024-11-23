'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import './invite.css'

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
        setIsCopied(true)
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
        setTimeout(() => {
          setButtonState('fadeOut')
          setTimeout(() => {
            setButtonState('initial')
            setNotification('')
            setIsCopied(false)
          }, 300)
        }, 200000)
      }).catch(err => {
        console.error('Failed to copy: ', err)
        setNotification('Failed to copy invite link. Please try again.')
      })
    }
  }

  const containerClass = `container ${isDarkMode ? 'dark-mode' : ''}`
  const contentClass = `content ${isDarkMode ? 'dark-mode' : ''}`
  const headerClass = `header ${isDarkMode ? 'dark-mode' : ''}`
  const titleClass = `title ${isDarkMode ? 'dark-mode' : ''}`
  const inviteButtonClass = `inviteButton ${buttonState} ${isDarkMode ? 'dark-mode' : ''}`
  const invitedSectionClass = `invitedSection ${isDarkMode ? 'dark-mode' : ''}`
  const invitedHeaderClass = `invitedHeader ${isDarkMode ? 'dark-mode' : ''}`
  const invitedTitleClass = `invitedTitle ${isDarkMode ? 'dark-mode' : ''}`
  const emptyStateClass = `emptyState ${isDarkMode ? 'dark-mode' : ''}`
  const notificationClass = `notification ${isDarkMode ? 'dark-mode' : ''}`
  const footerContainerClass = `footerContainer ${isDarkMode ? 'dark-mode' : ''}`
  const footerLinkClass = `footerLink ${isDarkMode ? 'dark-mode' : ''}`
  const activeFooterLinkClass = `footerLink activeFooterLink ${isDarkMode ? 'dark-mode' : ''}`
  const invitedByClass = `invitedBy ${isDarkMode ? 'dark-mode' : ''}`

  return (
    <div className={containerClass}>
      <div className="backgroundShapes"></div>
      <motion.div 
        className={contentClass}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {error ? (
          <motion.div 
            className="error"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        ) : !user ? (
          <div className="loader"></div>
        ) : (
          <>
            <motion.div 
              className={headerClass}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="iconContainer">
                <motion.svg 
                  className="icon" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </motion.svg>
                <motion.svg 
                  className="icon" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="4" fill="currentColor"/>
                </motion.svg>
              </div>
              <motion.p 
                className={titleClass}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                Invite your friends and earn 2,500 points for each one you bring!
              </motion.p>
            </motion.div>

            <motion.button 
              onClick={handleInvite} 
              className={inviteButtonClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 1 }}
            >
              <span className="buttonText">Copy Invite Link</span>
              <span className="buttonIcon">
                <i className="fas fa-copy"></i> Copied
              </span>
            </motion.button>

            {user.invitedBy && (
              <motion.div 
                className={invitedByClass}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
              >
                Invited by: {user.invitedBy}
              </motion.div>
            )}

            <motion.div 
              className={invitedSectionClass}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.4 }}
            >
              <div className={invitedHeaderClass}>
                <svg className="invitedIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className={invitedTitleClass}>Invited Friends : {invitedUsers.length}</h2>
              </div>
              {invitedUsers.length > 0 ? (
                <motion.ul 
                  className="invitedList"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: {
                      transition: {
                        staggerChildren: 0.1,
                        delayChildren: 1.6,
                      },
                    },
                  }}
                >
                  {invitedUsers.map((user, index) => (
                    <motion.li 
                      key={index}
                      variants={{
                        hidden: { y: 20, opacity: 0 },
                        visible: { y: 0, opacity: 1 },
                      }}
                    >
                      {user}
                    </motion.li>
                  ))}
                </motion.ul>
              ) : (
                <motion.div 
                  className={emptyStateClass}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.6 }}
                >
                  <p className="emptyStateText">The Invite List is empty</p>
                </motion.div>
              )}
            </motion.div>

            <AnimatePresence>
              {notification && (
                <motion.div 
                  className={notificationClass}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  transition={{ duration: 0.3 }}
                >
                  {notification}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
      <motion.div 
        className={footerContainerClass}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.8 }}
      >
        <Link href="/">
          <a className={footerLinkClass}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </a>
        </Link>
        <Link href="/invite">
          <a className={activeFooterLinkClass}>
            <i className="fas fa-users"></i>
            <span>Friends</span>
          </a>
        </Link>
        <Link href="/leaderboard">
          <a className={footerLinkClass}>
            <i className="fas fa-trophy"></i>
            <span>Leaderboard</span>
          </a>
        </Link>
        <Link href="/task">
          <a className={footerLinkClass}>
            <i className="fas fa-clipboard"></i>
            <span>Tasks</span>
          </a>
        </Link>
         <Link href="/timer">
          <a className={footerLinkClass}>
            <i className="fas fa-calendar"></i>
            <span>Event</span>
          </a>
        </Link>
      </motion.div>
    </div>
  )
}
