export default function PageHero({ eyebrow, title, lede, children }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        {eyebrow ? <p className="text-sm font-medium text-brand">{eyebrow}</p> : null}
        <h1 className="mt-2 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        {lede ? <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{lede}</p> : null}
        {children ? <div className="mt-8 flex flex-wrap gap-3">{children}</div> : null}
      </div>
    </header>
  )
}
