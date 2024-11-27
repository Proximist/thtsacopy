'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { Trophy, Users, CheckCircle, Edit, Save, Clock, Lock } from 'lucide-react'
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
  upiRequests?: string[];
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
  const [buttonStage, setButtonStage] = useState<'check' | 'claim' | 'done'>('check')
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkMessage, setCheckMessage] = useState('')
  const [buttonState, setButtonState] = useState('initial')

  // New state for UPI management
  const [upiId, setUpiId] = useState('')
  const [savedUpiIds, setSavedUpiIds] = useState<string[]>([])
  const [isEditingUpi, setIsEditingUpi] = useState(false)
  const [upiRequestSubmitted, setUpiRequestSubmitted] = useState(false)
  const [isUpiProcessing, setIsUpiProcessing] = useState(false)

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
              
              // Determine initial button stage
              if (data.user.completedTasks?.includes('invite_friends')) {
                setButtonStage('done')
              } else if (data.user.invitedUsers?.length === 3) {
                setButtonStage('claim')
              }

              // Set UPI-related states
              setSavedUpiIds(data.user.upiIds || [])
              setUpiRequestSubmitted(data.user.upiRequests && data.user.upiRequests.length > 0)
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

  useEffect(() => {

    if (user) {
      setSavedUpiIds(user.upiIds || [])
      setUpiRequestSubmitted(user.upiRequests && user.upiRequests.length > 0)
    }
  }, [user])

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

  const handleButtonAction = async () => {
    switch(buttonStage) {
      case 'check':
        // Check invite status
        if (invitedUsers.length < 3) {
          const remainingInvites = 3 - invitedUsers.length
          setCheckMessage(`You need to invite ${remainingInvites} more friend${remainingInvites !== 1 ? 's' : ''} to complete this task.`)
          setNotification(`${remainingInvites} more invite${remainingInvites !== 1 ? 's' : ''} needed!`)
        }
        break;
      
      case 'claim':
        if (invitedUsers.length >= 3 && user) {
          try {
            setIsProcessing(true)
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
              setButtonStage('done')
              setNotification('5000 points claimed successfully!')
              // Update user points in state
              setUser(prev => prev ? ({
                ...prev,
                points: (prev.points || 0) + 5000,
                completedTasks: [...(prev.completedTasks || []), 'invite_friends']
              }) : null)
            } else {
              setNotification(data.error || 'Failed to claim points')
            }
          } catch (err) {
            console.error('Error claiming points:', err)
            setNotification('An error occurred while claiming points')
          } finally {
            setIsProcessing(false)
          }
        }
        break;
    }
  }

  const handleSaveUpiId = async () => {
    if (!user || !upiId.trim() || isUpiProcessing) return;

    setIsUpiProcessing(true)
    try {
      const response = await fetch('/api/upi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          telegramId: user.telegramId,
          upiId: upiId.trim(),
          action: 'save'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSavedUpiIds(data.upiIds)
        setIsEditingUpi(false)
        setNotification('UPI ID saved successfully!')
      } else {
        setNotification(data.error || 'Failed to save UPI ID')
      }
    } catch (err) {
      console.error('Error saving UPI ID:', err)
      setNotification('An error occurred while saving UPI ID')
    } finally {
      setIsUpiProcessing(false)
    }
  }


   const handleSubmitUpiRequest = async () => {
    if (!user || !savedUpiIds.length || isUpiProcessing) return;

    setIsUpiProcessing(true)
    try {
      const response = await fetch('/api/upi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          telegramId: user.telegramId,
          upiId: savedUpiIds[savedUpiIds.length - 1], 
          action: 'request'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUpiRequestSubmitted(true)
        setNotification('UPI withdrawal request submitted!')
      } else {
        setNotification(data.error || 'Failed to submit UPI request')
      }
    } catch (err) {
      console.error('Error submitting UPI request:', err)
      setNotification('An error occurred while submitting UPI request')
    } finally {
      setIsUpiProcessing(false)
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
    switch(buttonStage) {
      case 'check':
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
      
      case 'claim':
        return (
          <button 
            onClick={handleButtonAction}
            className={`
              flex items-center space-x-2 
              px-4 py-2 
              bg-gradient-to-r from-green-500 to-emerald-600 
              text-white 
              rounded-full 
              transform transition-all duration-300
              hover:scale-105 
              active:scale-95
              ${isProcessing ? 'animate-pulse' : ''}
            `}
          >
            <Trophy className="w-5 h-5" />
            <span>{isProcessing ? 'Claiming...' : 'Claim 5000 Points'}</span>
          </button>
        );
      
      case 'done':
        return (
          <div className="flex items-center space-x-2 text-green-400">
            <CheckCircle className="w-6 h-6" />
            <span>Task Completed!</span>
          </div>
        );
    }
  }

  const renderUpiSection = () => {
    // Only show UPI section if the invite task is completed
    if (buttonStage !== 'done') {
      return null
    }

    const latestUpiId = savedUpiIds.length > 0 ? savedUpiIds[savedUpiIds.length - 1] : ''

    return (
      <div className="px-4 mt-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-4 shadow-lg">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold text-white">
              UPI Withdrawal
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {isEditingUpi ? (
              <input 
                type="text" 
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="Enter UPI ID"
                className="flex-grow p-2 rounded-lg bg-gray-700 text-white"
                disabled={isUpiProcessing}
              />
            ) : (
              <div className="flex-grow text-white/70">
                {latestUpiId || 'No UPI ID saved'}
              </div>
            )}

            {isEditingUpi ? (
              <button 
                onClick={handleSaveUpiId}
                disabled={isUpiProcessing}
                className={`p-2 rounded-full ${
                  isUpiProcessing 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-green-500'
                }`}
              >
                {isUpiProcessing ? <Lock className="w-5 h-5 text-white" /> : <Save className="w-5 h-5 text-white" />}
              </button>
            ) : (
              <button 
                onClick={() => setIsEditingUpi(true)}
                className="p-2 bg-blue-500 rounded-full"
              >
                <Edit className="w-5 h-5 text-white" />
              </button>
            )}
          </div>

          {latestUpiId && (
            <button 
              onClick={handleSubmitUpiRequest}
              disabled={upiRequestSubmitted || isUpiProcessing}
              className={`
                w-full flex items-center justify-center 
                px-4 py-2 
                ${upiRequestSubmitted || isUpiProcessing 
                  ? 'bg-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-emerald-600'}
                text-white 
                rounded-full 
                transform transition-all duration-300
                hover:scale-105 
                active:scale-95
              `}
            >
              {isUpiProcessing ? (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Processing...
                </>
              ) : upiRequestSubmitted ? (
                <>
                  <Clock className="w-5 h-5 mr-2" />
                  Withdrawal Requested
                </>
              ) : (
                'Submit Withdrawal Request'
              )}
            </button>
          )}
        </div>
      </div>
    )
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
                {renderUpiSection()}
              </div>
              
              {checkMessage && buttonStage === 'check' && (
                <div className="text-yellow-300 text-sm">
                  {checkMessage}
                </div>
              )}
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
