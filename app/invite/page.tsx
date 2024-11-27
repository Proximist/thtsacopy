'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { Users, Edit, Timer } from 'lucide-react'
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
  completedTasks?: string[];
  upiIds?: string[];
  requests?: { upiId: string, requestedAt: Date }[];
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
  const [buttonStage, setButtonStage] = useState<'check'>('check')
  const [checkMessage, setCheckMessage] = useState('')
  const [buttonState, setButtonState] = useState('initial')

  // UPI-related states
  const [upiIds, setUpiIds] = useState<string[]>([])
  const [currentUpiId, setCurrentUpiId] = useState('')
  const [isUpiEditing, setIsUpiEditing] = useState(false)
  const [hasRequestedPayout, setHasRequestedPayout] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const isDark = tg.colorScheme === 'dark'
      setIsDarkMode(isDark)
  
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
              
              // Persist UPI IDs from database
              if (data.user.upiIds && data.user.upiIds.length > 0) {
                setUpiIds(data.user.upiIds)
              }
              
              // Check if payout request exists
              setHasRequestedPayout(data.user.requests && data.user.requests.length > 0)
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

  const handleButtonAction = () => {
    if (invitedUsers.length < 3) {
      const remainingInvites = 3 - invitedUsers.length
      setCheckMessage(`You need to invite ${remainingInvites} more friend${remainingInvites !== 1 ? 's' : ''} to complete this task.`)
      setNotification(`${remainingInvites} more invite${remainingInvites !== 1 ? 's' : ''} needed!`)
    }
  }

  // New function to handle UPI ID saving
  const handleSaveUpiId = async () => {
    if (currentUpiId.trim() && user) {
      try {
        const response = await fetch('/api/save-upi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            telegramId: user.telegramId, 
            upiId: currentUpiId 
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setUpiIds(prev => [...prev, currentUpiId]);
          setIsUpiEditing(false);
          setCurrentUpiId('');
          setNotification('UPI ID saved successfully!');
        }
      } catch (error) {
        console.error('Error saving UPI ID:', error);
        setNotification('Failed to save UPI ID');
      }
    }
  }

  // New function to handle payout request
  const handleRequestPayout = async () => {
    if (upiIds.length > 0 && user) {
      try {
        const response = await fetch('/api/request-payout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            telegramId: user.telegramId, 
            upiId: upiIds[upiIds.length - 1] 
          })
        });
        
        const data = await response.json();
        if (data.success) {
          setHasRequestedPayout(true);
          setNotification('Payout request submitted!');
        }
      } catch (error) {
        console.error('Error requesting payout:', error);
        setNotification('Failed to submit payout request');
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

  // Render button based on current stage
  const renderTaskButton = () => {
    return (
      <button 
        onClick={handleButtonAction}
        className={`
          flex items-center space-x-2 
          px-4 py-2 
          bg-gradient-to-r from-blue-500 to-indigo-600 
          text-white 
          rounded-full 
          transform transition-all duration-300
          hover:scale-105 
          active:scale-95
          ${invitedUsers.length < 3 ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}
        `}
        disabled={invitedUsers.length >= 3}
      >
        <Users className="w-5 h-5" />
        <span>Check Progress</span>
      </button>
    );
  }

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

            <div className={invitedSectionClass}>
              <div className={invitedHeaderClass}>
                <svg className="invitedIcon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <h2 className={invitedTitleClass}>Invited Friends : {invitedUsers.length}</h2>
              </div>
            </div>

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

            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-white/70">
                  Invited Friends: {invitedUsers.length}/3
                </span>
                {renderTaskButton()}
              </div>
              
              {checkMessage && (
                <div className="text-yellow-300 text-sm">
                  {checkMessage}
                </div>
              )}
            </div>
          </div>
        </div>
            )}

            {/* UPI Payout Section */}
            {invitedUsers.length >= 10 && (
  <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold text-white">UPI Payout</h3>
      {!isUpiEditing ? (
        <button 
          onClick={() => setIsUpiEditing(true)} 
          className="text-blue-400 hover:text-blue-300"
        >
          <Edit className="w-5 h-5" />
        </button>
      ) : null}
    </div>
    
    {isUpiEditing ? (
      <div className="flex space-x-2">
        <input 
          type="text" 
          placeholder="Enter UPI ID" 
          value={currentUpiId}
          onChange={(e) => setCurrentUpiId(e.target.value)}
          className="flex-grow p-2 rounded bg-gray-700 text-white"
        />
        <button 
          onClick={handleSaveUpiId}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-between">
        <span className="text-white/70">
          {upiIds.length > 0 ? upiIds[upiIds.length - 1] : 'No UPI ID saved'}
        </span>
        {!hasRequestedPayout ? (
          <button 
            onClick={handleRequestPayout}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Request Payout
          </button>
        ) : (
          <Timer className="w-6 h-6 text-yellow-400" />
        )}
      </div>
    )}
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
