'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { Users, Edit, Timer, CheckCircle, Wallet } from 'lucide-react'
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
  taskButton1?: boolean;
  taskButton2?: boolean;
  taskButton3?: boolean;
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
  const [checkMessage, setCheckMessage] = useState('')
  const [withdrawBalance, setWithdrawBalance] = useState(0)

  // Task button states
  const [taskButton1Claimed, setTaskButton1Claimed] = useState(false);
  const [taskButton2Claimed, setTaskButton2Claimed] = useState(false);
  const [taskButton3Claimed, setTaskButton3Claimed] = useState(false);

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
            
            // Calculate balance based on completed tasks
            let calculatedBalance = 0;
            if (data.user.taskButton1) calculatedBalance += 2;
            if (data.user.taskButton2) calculatedBalance += 5;
            if (data.user.taskButton3) calculatedBalance += 30;
            
            setWithdrawBalance(calculatedBalance);
            
            // Persist task button states
            setTaskButton1Claimed(data.user.taskButton1 || false);
            setTaskButton2Claimed(data.user.taskButton2 || false);
            setTaskButton3Claimed(data.user.taskButton3 || false);
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
 // Modify handleTaskClaim to update balance
const handleTaskClaim = async (points: number, taskType: string) => {
  if (!user) return;

  try {
    const response = await fetch('/api/claim-task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        telegramId: user.telegramId, 
        taskType, 
        points 
      })
    });

    const data = await response.json();
    if (data.success) {
      // Update the user's balance and task button states
      setUser(prev => prev ? {...prev, points: prev.points + points, [taskType]: true} : null);
      setWithdrawBalance(prevBalance => prevBalance + points);
    }
  } catch (error) {
    console.error('Error claiming task:', error);
  }
};
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
        }, 3000)
      }).catch(err => {
        console.error('Failed to copy: ', err)
        setNotification('Failed to copy invite link. Please try again.')
        setTimeout(() => {
          setNotification('')
        }, 3000)
      })
    }
  }

  const handleButtonAction = () => {
    if (invitedUsers.length < 3) {
      const remainingInvites = 3 - invitedUsers.length
      setCheckMessage(`You need to invite ${remainingInvites} more friend${remainingInvites !== 1 ? 's' : ''} to complete this task.`)
      setNotification(`${remainingInvites} more invite${remainingInvites !== 1 ? 's' : ''} needed!`)
      setTimeout(() => {
        setNotification('')
      }, 3000)
    }
  }

  // Render task buttons with claim functionality
  const renderTaskButton = () => {
  // Always show as claimed if taskButton1Claimed is true
  if (taskButton1Claimed || invitedUsers.length >= 1) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-full">
        <CheckCircle className="w-5 h-5" />
        <span>Claimed</span>
      </div>
    );
  }

  return (
    <button 
      onClick={() => handleTaskClaim(2)}
      className={`
        flex items-center space-x-2 
        px-4 py-2 
        bg-gradient-to-r from-blue-500 to-indigo-600 
        text-white 
        rounded-full 
        transform transition-all duration-300
        hover:scale-55 
        active:scale-45
        ${invitedUsers.length < 1 ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={invitedUsers.length < 1}
    >
      <Users className="w-5 h-5" />
      <span>₹2 </span>
    </button>
  );
}

const renderTaskButton1 = () => {
  // Always show as claimed if taskButton2Claimed is true or invited users meet the condition
  if (taskButton2Claimed || invitedUsers.length >= 3) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-full">
        <CheckCircle className="w-5 h-5" />
        <span>Claimed</span>
      </div>
    );
  }

  return (
    <button 
      onClick={() => handleTaskClaim(5)}
      className={`
        flex items-center space-x-2 
        px-4 py-2 
        bg-gradient-to-r from-blue-500 to-indigo-600 
        text-white 
        rounded-full 
        transform transition-all duration-300
        hover:scale-55 
        active:scale-45
        ${invitedUsers.length < 3 ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={invitedUsers.length < 3}
    >
      <Users className="w-5 h-5" />
      <span>₹5 </span>
    </button>
  );
}

const renderTaskButton2 = () => {
  // Always show as claimed if taskButton3Claimed is true or invited users meet the condition
  if (taskButton3Claimed || invitedUsers.length >= 10) {
    return (
      <div className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-full">
        <CheckCircle className="w-5 h-5" />
        <span>Claimed</span>
      </div>
    );
  }

  return (
    <button 
      onClick={() => handleTaskClaim(30)}
      className={`
        flex items-center space-x-2 
        px-4 py-2 
        bg-gradient-to-r from-blue-500 to-indigo-600 
        text-white 
        rounded-full 
        transform transition-all duration-300
        hover:scale-55 
        active:scale-45
        ${invitedUsers.length < 10 ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      disabled={invitedUsers.length < 10}
    >
      <Users className="w-5 h-5" />
      <span>₹30</span>
    </button>
  );
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
          setTimeout(() => {
            setNotification('')
          }, 3000)
        }
      } catch (error) {
        console.error('Error saving UPI ID:', error);
        setNotification('Failed to save UPI ID');
        setTimeout(() => {
          setNotification('')
        }, 3000)
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
          setTimeout(() => {
            setNotification('')
          }, 3000)
        }
      } catch (error) {
        console.error('Error requesting payout:', error);
        setNotification('Failed to submit payout request');
        setTimeout(() => {
          setNotification('')
        }, 3000)
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
                <Users className="w-6 h-6 text-blue-400" />
                <h2 className={invitedTitleClass}>Invited Friends: {invitedUsers.length}</h2>
              </div>
              <div className="mt-2 bg-gray-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-in-out"
                  style={{ 
                    width: `${Math.min(invitedUsers.length / 10 * 100, 100)}%`,
                    opacity: invitedUsers.length > 0 ? 1 : 0.3
                  }}
                />
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

      <div className="space-y-4">
        {/* First Task */}
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/70">
              Invite 1 Friend
            </span>
            {renderTaskButton()}
          </div>
          <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-in-out"
              style={{ 
                width: `${Math.min(invitedUsers.length / 1 * 100, 100)}%`,
                opacity: invitedUsers.length > 0 ? 1 : 0.3
              }}
            />
          </div>
        </div>

        {/* Second Task */}
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/70">
              Invite 3 Friends
            </span>
            {renderTaskButton1()}
          </div>
          <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-in-out"
              style={{ 
                width: `${Math.min(invitedUsers.length / 5 * 100, 100)}%`,
                opacity: invitedUsers.length > 0 ? 1 : 0.3
              }}
            />
          </div>
        </div>

        {/* Third Task */}
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-white/70">
              Invite 10 Friends
            </span>
            {renderTaskButton2()}
          </div>
          <div className="bg-gray-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-in-out"
              style={{ 
                width: `${Math.min(invitedUsers.length / 10 * 100, 100)}%`,
                opacity: invitedUsers.length > 0 ? 1 : 0.3
              }}
            />
          </div>
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
      {(invitedUsers.length === 1 || invitedUsers.length === 3 || invitedUsers.length === 10) && (
        <div className="mt-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Wallet className="w-8 h-8 text-blue-400" />
                <h3 className="text-2xl font-bold text-white">UPI Payout</h3>
              </div>
              {!isUpiEditing && (
                <button
                  onClick={() => setIsUpiEditing(true)}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 p-2 rounded-full transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Balance Display */}
            <div className="bg-white/10 rounded-2xl p-6 mb-4 flex items-center justify-between">
              <div>
                <p className="text-white/70 text-sm mb-1">Available Balance</p>
                <p className="text-6xl font-bold text-white tracking-tighter">
                  ₹{withdrawBalance}
                </p>
              </div>
              <div className="bg-blue-500/20 rounded-full p-3">
                <Wallet className="w-10 h-10 text-blue-300" />
              </div>
            </div>

            <div className="space-y-4">
              {isUpiEditing ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Enter UPI ID"
                    value={currentUpiId}
                    onChange={(e) => setCurrentUpiId(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        handleSaveUpiId();
                        handleRequestPayout();
                      }}
                      className="flex-grow bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl hover:opacity-90 transition-all"
                      disabled={hasRequestedPayout}
                    >
                      {hasRequestedPayout ? 'Processing' : 'Request Payout'}
                    </button>
                    <button
                      onClick={() => setIsUpiEditing(false)}
                      className="border border-white/20 text-white hover:bg-white/5 py-3 px-6 rounded-xl transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-white/70">
                    {upiIds.length > 0 ? upiIds[upiIds.length - 1] : 'No UPI ID saved'}
                  </span>
                  {!hasRequestedPayout ? (
                    <button
                      onClick={handleRequestPayout}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-6 rounded-xl hover:opacity-90 transition-all"
                      disabled={hasRequestedPayout || upiIds.length === 0 || withdrawBalance === 0}
                    >
                      Request Payout
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-400">
                      <Timer className="w-5 h-5" />
                      <span>Processing</span>
                    </div>
                  )}
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
