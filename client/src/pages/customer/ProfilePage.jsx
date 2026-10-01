import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { authApi, notificationApi, reviewApi } from '../../services'
import { useAuth } from '../../context/AuthContext'
import { usePageMeta } from '../../hooks/usePageMeta'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'

export default function ProfilePage() {
  usePageMeta('Profile · NEARE')
  const { user, logout, setUser } = useAuth()
  const toast = useToast()
  const notes = useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list })
  const reviews = useQuery({ queryKey: ['my-reviews'], queryFn: reviewApi.mine })
  const save = useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (result) => {
      setUser(result.user)
      toast.success('Profile updated')
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-5">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <form className="mt-4 space-y-3" onSubmit={(event) => {
          event.preventDefault()
          const form = new FormData(event.target)
          save.mutate({ name: form.get('name'), phone: form.get('phone') })
        }}>
          <Field label="Name"><TextInput name="name" defaultValue={user.name} /></Field>
          <Field label="Email"><TextInput value={user.email} disabled /></Field>
          <Field label="Phone"><TextInput name="phone" defaultValue={user.phone} /></Field>
          <Button type="submit">Save</Button>
        </form>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="underline" to="/addresses">Saved addresses</Link>
          <Link className="underline" to="/orders">Order history</Link>
          <Link className="underline" to="/favorites">Favorites</Link>
        </div>
        <Button variant="ghost" className="mt-4" onClick={logout}>Sign out</Button>
      </section>
      <section className="space-y-4">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Notifications</h2>
            <button type="button" className="text-sm text-muted" onClick={() => notificationApi.readAll()}>Mark read</button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {(notes.data?.notifications || []).map((item) => (
              <li key={item._id} className={item.read ? 'text-muted' : ''}>
                <p className="font-medium">{item.title}</p>
                <p>{item.message}</p>
              </li>
            ))}
            {!notes.data?.notifications?.length ? <li className="text-muted">No notifications yet.</li> : null}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="font-semibold">Reviews</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(reviews.data?.reviews || []).map((review) => (
              <li key={review._id}>{review.shop?.name} · {review.rating}/5</li>
            ))}
            {!reviews.data?.reviews?.length ? <li className="text-muted">Completed orders can be reviewed from the order page.</li> : null}
          </ul>
        </div>
      </section>
    </div>
  )
}
