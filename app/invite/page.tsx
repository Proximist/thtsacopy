'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { Users, Edit, Timer } from 'lucide-react'
import './invite.css'
import '../globals.css'

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
  claimedBalances?: { [key: string]: boolean };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Invite() {
  const containerClass = `container ${isDarkMode ? 'dark-mode' : ''}`
  const contentClass = `content ${isDarkMode ? 'dark-mode' : ''}`
  const headerClass = `header ${isDarkMode ? 'dark-mode' : ''}`
  const titleClass = `title ${isDarkMode ? 'dark-mode' : ''}`
  const inviteButtonClass = `inviteButton ${buttonState} ${isDarkMode ? 'dark-mode' : ''}`
  const invitedSectionClass = `invitedSection ${isDarkMode ? 'dark-mode' : ''}`
  const invitedHeaderClass = `invitedHeader ${isDarkMode ? 'dark-mode' : ''}`
  const invitedTitleClass = `invitedTitle ${isDarkMode ? 'dark-mode' : ''}`
  const [user, setUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [inviteLink, setInviteLink] = useState('')
  const [invitedUsers, setInvitedUsers] = useState<string[]>([])
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [buttonStage, setButtonStage] = useState<'check'>('check')
  const [checkMessage, setCheckMessage] = useState('')
  const [buttonState, setButtonState] = useState('initial')

  // UPI-related states
  const [upiIds, setUpiIds] = useState<string[]>([])
  const [currentUpiId, setCurrentUpiId] = useState('')
  const [isUpiEditing, setIsUpiEditing] = useState(false)
  const [hasRequestedPayout, setHasRequestedPayout] = useState(false)
  const [claimedBalances, setClaimedBalances] = useState<{[key: string]: boolean}>({})
  const [totalBalance, setTotalBalance] = useState(0)

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
              
              // Set initial claimed balances
              const initialClaimedBalances = {
                '1invite': false,
                '3invites': false,
                '10invites': false
              }
              setClaimedBalances(initialClaimedBalances)
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

  // New function to claim task reward
  const claimTaskReward = async (taskType: string, points: number) => {
    try {
      const response = await fetch('/api/claim-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          telegramId: user?.telegramId, 
          taskType, 
          points 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        // Update claimed balances and total balance
        setClaimedBalances(prev => ({
          ...prev, 
          [taskType]: true
        }));
        
        // Calculate total balance
        const newBalance = calculateTotalBalance();
        setTotalBalance(newBalance);
        
        setNotification(`Successfully claimed ₹${points}!`);
        setTimeout(() => setNotification(''), 3000);
        return true;
      }
    } catch (error) {
      console.error('Error claiming task:', error);
      setNotification('Failed to claim task');
      setTimeout(() => setNotification(''), 3000);
    }
    return false;
  }

  // Calculate total balance based on claimed tasks
  const calculateTotalBalance = () => {
    let total = 0;
    if (claimedBalances['1invite']) total += 2;
    if (claimedBalances['3invites']) total += 5;
    if (claimedBalances['10invites']) total += 30;
    return total;
  }

  // Render task button with claim functionality
  const renderTaskButton = () => {
    const isClaimable = invitedUsers.length >= 1 && !claimedBalances['1invite'];
    return (
      <button 
        onClick={() => isClaimable && claimTaskReward('1invite', 2)}
        className={`
          flex items-center space-x-2 
          px-4 py-2 
          ${isClaimable 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'}
          rounded-full 
          transform transition-all duration-300
          hover:scale-55 
          active:scale-45
        `}
        disabled={!isClaimable}
      >
        <Users className="w-5 h-5" />
        <span>₹2</span>
      </button>
    );
  }

  const renderTaskButton1 = () => {
    const isClaimable = invitedUsers.length >= 3 && !claimedBalances['3invites'];
    return (
      <button 
        onClick={() => isClaimable && claimTaskReward('3invites', 5)}
        className={`
          flex items-center space-x-2 
          px-4 py-2 
          ${isClaimable 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'}
          rounded-full 
          transform transition-all duration-300
          hover:scale-55 
          active:scale-45
        `}
        disabled={!isClaimable}
      >
        <Users className="w-5 h-5" />
        <span>₹5</span>
      </button>
    );
  }

  const renderTaskButton2 = () => {
    const isClaimable = invitedUsers.length >= 10 && !claimedBalances['10invites'];
    return (
      <button 
        onClick={() => isClaimable && claimTaskReward('10invites', 30)}
        className={`
          flex items-center space-x-2 
          px-4 py-2 
          ${isClaimable 
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'}
          rounded-full 
          transform transition-all duration-300
          hover:scale-55 
          active:scale-45
        `}
        disabled={!isClaimable}
      >
        <Users className="w-5 h-5" />
        <span>₹30</span>
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
         {(invitedUsers.length >= 1 || invitedUsers.length >= 3 || invitedUsers.length >= 10) && (
    <div className="mt-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-lg border border-white/10 rounded-lg overflow-hidden">
      <div className="p-4 flex flex-col items-center">
        <h3 className="text-2xl font-bold text-white">UPI Payout</h3>
        <div className="text-6xl font-extrabold text-white mt-2 mb-4">
          ₹{totalBalance}
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
                <div className="p-4">
                  {isUpiEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter UPI ID"
                        value={currentUpiId}
                        onChange={(e) => setCurrentUpiId(e.target.value)}
                        className="w-full p-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-white/50"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            handleSaveUpiId();
                            handleRequestPayout();
                          }}
                          className="flex-grow bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                          disabled={hasRequestedPayout}
                        >
                          {hasRequestedPayout ? 'Processing' : 'Request Payout'}
                        </button>
                        <button
                          onClick={() => setIsUpiEditing(false)}
                          className="border border-white/10 text-white hover:bg-white/5 py-2 px-4 rounded-md transition-colors"
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
                          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md transition-colors"
                          disabled={hasRequestedPayout || upiIds.length === 0}
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
