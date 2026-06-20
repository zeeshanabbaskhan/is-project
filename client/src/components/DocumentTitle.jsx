import { useEffect } from 'react'
import { useLocation, matchPath } from 'react-router-dom'

const APP_NAME = 'SecureTransfer'

const ROUTE_TITLES = [
    { path: '/share/public/:token', title: 'Shared File' },
    { path: '/share-link/:linkId/trace', title: 'Share Trace' },
    { path: '/files/:id', title: 'File Details' },
    { path: '/share/:id', title: 'Share Settings' },
    { path: '/signup', title: 'Sign Up' },
    { path: '/login', title: 'Log In' },
    { path: '/dashboard', title: 'Dashboard' },
    { path: '/upload', title: 'Upload Files' },
    { path: '/inbox', title: 'Inbox' },
    { path: '/secure-note', title: 'Secure Note' },
    { path: '/settings', title: 'Settings' },
    { path: '/devices', title: 'Devices' },
    { path: '/help', title: 'Help Center' },
    { path: '/', title: 'Home' },
]

export function DocumentTitle() {
    const { pathname } = useLocation()

    useEffect(() => {
        const match = ROUTE_TITLES.find(({ path }) =>
            matchPath({ path, end: true }, pathname)
        )
        document.title = match ? `${match.title} | ${APP_NAME}` : APP_NAME
    }, [pathname])

    return null
}
