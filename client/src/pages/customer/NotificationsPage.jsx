import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { notificationApi } from '../../services'
import { usePageMeta } from '../../hooks/usePageMeta'
import { formatAgo } from '../../lib/format'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'

export default function NotificationsPage() {
  usePageMeta('Notifications · NEARE')
  const queryClient = useQueryClient()
  const notes = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list })
  const items = notes.data?.notifications || []

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {notes.data?.unread ? (
          <button type="button" className="text-sm text-info" onClick={() => notificationApi.readAll().then(() => queryClient.invalidateQueries({ queryKey: ['notifications'] }))}>
            Mark all as read
          </button>
        ) : null}
      </div>
      {notes.isError ? <div className="mt-6"><EmptyState title="We couldn't load notifications." body="Try again." action={<Button onClick={() => notes.refetch()}>Try again</Button>} /></div> : null}
      {notes.isSuccess && !items.length ? <div className="mt-6"><EmptyState title="No notifications yet." body="Order updates will show up here." /></div> : null}
      <ul className="mt-4 divide-y divide-line border border-line bg-white">
        {items.map((note) => {
          const body = (
            <>
              <p className="font-medium">{note.title}</p>
              <p className="mt-1 text-sm text-muted">{note.message}</p>
              <p className="mt-1 text-xs text-muted">{formatAgo(note.createdAt)}{note.read ? '' : ' · Unread'}</p>
            </>
          )
          return (
            <li key={note._id} className="px-4 py-3 text-sm">
              {note.order ? <Link to={`/orders/${note.order}`} className="block">{body}</Link> : body}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
