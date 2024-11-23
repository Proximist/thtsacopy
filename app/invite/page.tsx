'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { WebApp } from '@twa-dev/types'
import { motion, useAnimation } from 'framer-motion'
import { useSpring, animated } from '@react-spring/web'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import Lottie from 'lottie-react'
import dynamic from 'next/dynamic'
import { Engine, Container } from 'tsparticles-engine'
import inviteAnimation from './invite-animation.json'
import './invite.css'

// Dynamically import Particles with no SSR
const Particles = dynamic(
  () => import('react-tsparticles').then((mod) => mod.Particles),
  { ssr: false }
)
// Dynamically import loadFull
const loadFull = dynamic(
  () => import('tsparticles').then((mod) => mod.loadFull),
  { ssr: false }
)

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

  const particlesInit = useCallback(async (engine: Engine) => {
    if (loadFull) {
      await loadFull(engine)
    }
  }, [])

  const particlesLoaded = useCallback(async (container?: Container) => {
    console.log(container)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      const isDark = tg.colorScheme === 'dark'
      setIsDarkMode(isDark)

      if (typeof document !== 'undefined') {
        document.body.classList.toggle('dark-mode', isDark)
      }

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
              setInviteLink(`http://t.me/pixel_dogs_bot/Pixel_dogs_web/start?startapp=${data.user.telegramId}`)
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
    setIsCopied(true)
    setNotification('Invite link copied to clipboard!')
    setTimeout(() => {
      setIsCopied(false)
      setNotification('')
    }, 3000)
  }

  const fadeIn = useSpring({
    opacity: user ? 1 : 0,
    transform: user ? 'translateY(0)' : 'translateY(50px)',
  })

  const notificationAnimation = useAnimation()

  useEffect(() => {
    if (notification) {
      notificationAnimation.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 },
      })
      setTimeout(() => {
        notificationAnimation.start({
          opacity: 0,
          y: 20,
          transition: { duration: 0.5 },
        })
      }, 2500)
    }
  }, [notification, notificationAnimation])

  const particlesOptions = {
    background: {
      color: {
        value: isDarkMode ? "#0F172A" : "#E2E8F0",
      },
    },
    fpsLimit: 60,
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: "push",
        },
        onHover: {
          enable: true,
          mode: "repulse",
        },
        resize: true,
      },
      modes: {
        push: {
          quantity: 4,
        },
        repulse: {
          distance: 200,
          duration: 0.4,
        },
      },
    },
    particles: {
      color: {
        value: isDarkMode ? "#4B5563" : "#94A3B8",
      },
      links: {
        color: isDarkMode ? "#4B5563" : "#94A3B8",
        distance: 150,
        enable: true,
        opacity: 0.5,
        width: 1,
      },
      move: {
        direction: "none",
        enable: true,
        outModes: {
          default: "bounce",
        },
        random: false,
        speed: 2,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: 800,
        },
        value: 80,
      },
      opacity: {
        value: 0.5,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: 1, max: 5 },
      },
    },
    detectRetina: true,
  }

  return (
    <div className={`container ${isDarkMode ? 'dark-mode' : ''}`}>
      {typeof window !== 'undefined' && (
        <Particles
          id="tsparticles"
          init={particlesInit}
          loaded={particlesLoaded}
          options={particlesOptions}
        />
      )}
      
      <animated.div style={fadeIn} className="content">
        {error ? (
          <motion.div
            className="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {error}
          </motion.div>
        ) : !user ? (
          <Lottie animationData={inviteAnimation} loop={true} />
        ) : (
          <>
            <motion.div
              className="header"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="title">Invite Friends & Earn Points!</h1>
              <p className="subtitle">Get 2,500 points for each friend you invite</p>
            </motion.div>

            <CopyToClipboard text={inviteLink} onCopy={handleInvite}>
              <motion.button
                className={`inviteButton ${isCopied ? 'copied' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCopied ? 'Copied!' : 'Copy Invite Link'}
              </motion.button>
            </CopyToClipboard>

            {user.invitedBy && (
              <motion.div
                className="invitedBy"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Invited by: {user.invitedBy}
              </motion.div>
            )}

            <motion.div
              className="invitedSection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <h2 className="invitedTitle">Invited Friends: {invitedUsers.length}</h2>
              {invitedUsers.length > 0 ? (
                <ul className="invitedList">
                  {invitedUsers.map((user, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      {user}
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <motion.div
                  className="emptyState"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <p>The Invite List is empty</p>
                  <Lottie animationData={inviteAnimation} loop={true} style={{ width: 200, height: 200 }} />
                </motion.div>
              )}
            </motion.div>

            <motion.div
              className="notification"
              initial={{ opacity: 0, y: 20 }}
              animate={notificationAnimation}
            >
              {notification}
            </motion.div>
          </>
        )}
      </animated.div>
      
      <motion.div
        className="footerContainer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Link href="/invite">
          <motion.a
            className="footerLink activeFooterLink"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-users"></i>
            <span>Friends</span>
          </motion.a>
        </Link>
        <Link href="/leaderboard">
          <motion.a
            className="footerLink"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <i className="fas fa-trophy"></i>
            <span>Leaderboard</span>
          </motion.a>
        </Link>
      </motion.div>
    </div>
  )
}
