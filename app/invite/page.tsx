'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { Trophy, Users, CheckCircle } from 'lucide-react'
import './invite.css'
import '../globals.css'

// Define a type for the user object
type User = {
  telegramId: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  points?: number;
  invitedUsers?: string[];
  invitedBy?: string;
  currentTime?: Date;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Invite() {
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [buttonState, setButtonState] = useState('initial')
  const [taskCompleted, setTaskCompleted] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const isDark = tg.colorScheme === 'dark'
      setIsDarkMode(isDark)

      // Add theme classes to body
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

  const handleClaimPoints = async () => {
    if (invitedUsers.length >= 3 && !taskCompleted && user) {
      try {
        setIsClicking(true)
        const response = await fetch('/api/claim-task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            telegramId: user.telegramId,
            taskType: 'invite_friends',
            points: 5000
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          setTaskCompleted(true)
          setNotification('5000 points claimed successfully!')
          // Update user points in state
          setUser(prev => prev ? ({
            ...prev,
            points: (prev.points || 0) + 5000
          }) : null)
        } else {
          setNotification(data.error || 'Failed to claim points')
        }
      } catch (err) {
        console.error('Error claiming points:', err)
        setNotification('An error occurred while claiming points')
      } finally {
        setTimeout(() => setIsClicking(false), 500)
      }
    }
  }

  // Add dark mode classes to elements
  const containerClass = `container ${isDarkMode ? 'dark-mode' : ''}`
  const contentClass = `content ${isDarkMode ? 'dark-mode' : ''}`
  const headerClass = `header ${isDarkMode ? 'dark-mode' : ''}`
  const titleClass = `title ${isDarkMode ? 'dark-mode' : ''}`
  const inviteButtonClass = `inviteButton ${buttonState} ${isDarkMode ? 'dark-mode' : ''}`
  const invitedSectionClass = `invitedSection ${isDarkMode ? 'dark-mode' : ''}`
  const invitedHeaderClass = `invitedHeader ${isDarkMode ? 'dark-mode' : ''}`
  const invitedTitleClass = `invitedTitle ${isDarkMode ? 'dark-mode' : ''}`
  const tasksContainerClass = `tasksContainer ${isDarkMode ? 'dark-mode' : ''}`
  const taskItemClass = `taskItem ${isDarkMode ? 'dark-mode' : ''}`
  const progressBarClass = `progressBar ${isDarkMode ? 'dark-mode' : ''}`
  const claimButtonClass = `claimButton ${isDarkMode ? 'dark-mode' : ''}`

  return (
    <div className={containerClass}>
      <div className="backgroundShapes"></div>
      <div className="floatingElements">
        <div className="floatingElement"></div>
        <div className="floatingElement"></div>
        <div className="floatingElement"></div>
      </div>
      <div className={contentClass}>
        {error ? (
          <div className="error">{error}</div>
        ) : !user ? (
          <div className="loader"></div>
        ) : (
          <>
            <div className={headerClass}>
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
              <p className={titleClass}>
                Invite your friends and earn Real Money!
              </p>
            </div>

            <button 
              onClick={handleInvite} 
              className={inviteButtonClass}
            >
              <span className="buttonIcon">
                <i className="fas fa-copy"></i> Copy Invite Link
              </span>
            </button>

            {user.invitedBy && (
              <div className={`invitedBy ${isDarkMode ? 'dark-mode' : ''}`}>
                Invited by: {user.invitedBy}
              </div>
            )}

{user && (
        <div className="px-4 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-4 shadow-lg">
            <div className="flex items-center space-x-4">
              <Users className="w-8 h-8 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">
                Invite Challenge
              </h3>
            </div>

            <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-in-out"
                style={{ 
                  width: `${Math.min(invitedUsers.length / 3 * 100, 100)}%`,
                  opacity: invitedUsers.length > 0 ? 1 : 0.3
                }}
              />
            </div>

            <div className="flex justify-between items-center">
              <span className="text-white/70">
                Invited Friends: {invitedUsers.length}/3
              </span>
              {invitedUsers.length >= 3 && !taskCompleted ? (
                <button 
                  onClick={handleClaimPoints}
                  disabled={taskCompleted}
                  className={`
                    flex items-center space-x-2 
                    px-4 py-2 
                    bg-gradient-to-r from-green-500 to-emerald-600 
                    text-white 
                    rounded-full 
                    transform transition-all duration-300
                    hover:scale-105 
                    active:scale-95
                    ${isClicking ? 'animate-pulse' : ''}
                  `}
                >
                  <Trophy className="w-5 h-5" />
                  <span>Claim 5000 Points</span>
                </button>
              ) : taskCompleted ? (
                <div className="flex items-center space-x-2 text-green-400">
                  <CheckCircle className="w-6 h-6" />
                  <span>Task Completed!</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
            
            {notification && (
              <div className={`notification ${isDarkMode ? 'dark-mode' : ''}`}>
                {notification}
              </div>
            )}
          </>
        )}
      </div>
      <div className={`footerContainer ${isDarkMode ? 'dark-mode' : ''}`}>
        <Link href="/">
          <a className={`footerLink ${isDarkMode ? 'dark-mode' : ''}`}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </a>
        </Link>
        <Link href="/invite">
          <a className={`footerLink activeFooterLink ${isDarkMode ? 'dark-mode' : ''}`}>
            <i className="fas fa-users"></i>
            <span>Friends</span>
          </a>
        </Link>
        <Link href="/leaderboard">
          <a className={`footerLink ${isDarkMode ? 'dark-mode' : ''}`}>
            <i className="fas fa-trophy"></i>
            <span>Leaderboard</span>
          </a>
        </Link>
      </div>
    </div>
  )
}
