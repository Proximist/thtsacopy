'use client'

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { WebApp } from '@twa-dev/types';
import './invite.css'
import { 
  Users,
  Home,
  Trophy,
  Copy,
  Sparkles,
  Gift
} from 'lucide-react';

// Particle component for background effects
const Particles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
  );
};

export default function Invite() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [buttonState, setButtonState] = useState('initial');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      setIsDarkMode(tg.colorScheme === 'dark');

      const initDataUnsafe = tg.initDataUnsafe || {};

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...initDataUnsafe.user,
            start_param: initDataUnsafe.start_param || null
          })
        })
          .then(res => res.json())
          .then(data => {
            if (data.error) {
              setError(data.error);
            } else {
              setUser(data.user);
              setInviteLink(`http://t.me/miniappw21bot/cmos1/start?startapp=${data.user.telegramId}`);
              setInvitedUsers(data.user.invitedUsers || []);
            }
          })
          .catch(() => setError('Failed to fetch user data'));
      } else {
        setError('No user data available');
      }
    } else {
      setError('This app should be opened in Telegram');
    }
  }, []);

  const handleInvite = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
        .then(() => {
          setButtonState('copied');
          setNotification('Invite link copied to clipboard!');
          setTimeout(() => {
            setButtonState('fadeOut');
            setTimeout(() => {
              setButtonState('initial');
              setNotification('');
            }, 300);
          }, 5000);
        })
        .catch(() => setNotification('Failed to copy invite link. Please try again.'));
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-indigo-950 to-purple-900 text-white overflow-hidden">
      <Particles />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),transparent_80%)]" />
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500/10 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {error ? (
          <div className="text-red-400 bg-red-900/20 p-4 rounded-lg backdrop-blur-sm animate-fadeIn">
            {error}
          </div>
        ) : !user ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Header Section */}
            <div className="text-center space-y-6">
              <div className="flex justify-center gap-4">
                <Gift className="w-16 h-16 text-purple-400 animate-float" />
                <Sparkles className="w-16 h-16 text-blue-400 animate-float animation-delay-1000" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Invite your friends and earn Real Money!
              </h1>
            </div>

            {/* Invite Button */}
            <button
              onClick={handleInvite}
              className="w-full py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl font-bold text-lg relative overflow-hidden group transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center justify-center gap-2">
                <Copy className="w-5 h-5" />
                <span>Copy Invite Link</span>
              </div>
            </button>

            {/* Invited Users Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-6 space-y-6 border border-white/10">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-400" />
                <h2 className="text-xl font-semibold">
                  Invited Friends: {invitedUsers.length}
                </h2>
              </div>

              {invitedUsers.length > 0 ? (
                <ul className="space-y-3">
                  {invitedUsers.map((user, index) => (
                    <li
                      key={index}
                      className="bg-white/5 p-4 rounded-xl flex items-center gap-3 transition-all duration-300 hover:translate-x-2 hover:bg-white/10"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        👤
                      </div>
                      <span>{user}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>The Invite List is empty</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/20 backdrop-blur-lg border-t border-white/10">
          <div className="max-w-md mx-auto flex justify-around py-4">
            <Link href="/">
              <a className="flex flex-col items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors">
                <Home className="w-6 h-6" />
                <span className="text-xs">Home</span>
              </a>
            </Link>
            <Link href="/invite">
              <a className="flex flex-col items-center gap-1 text-purple-400">
                <Users className="w-6 h-6" />
                <span className="text-xs">Friends</span>
              </a>
            </Link>
            <Link href="/leaderboard">
              <a className="flex flex-col items-center gap-1 text-gray-400 hover:text-purple-400 transition-colors">
                <Trophy className="w-6 h-6" />
                <span className="text-xs">Leaderboard</span>
              </a>
            </Link>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-purple-500/90 backdrop-blur-sm px-6 py-3 rounded-full text-white shadow-lg animate-slideUp">
            {notification}
          </div>
        )}
      </div>
    </div>
  );
}
