import { motion, useReducedMotion } from 'framer-motion'
import { frame, Reveal } from './homeUi'
import { steps } from './homeData'

export default function HowItWorks() {
  const reduce = useReducedMotion()

  return (
    <section className="border-y border-line bg-white" aria-labelledby="how-neare-works">
      <div className={`${frame} py-16 lg:py-20`}>
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">How NEARE works</p>
          <h2 id="how-neare-works" className="font-display mt-3 max-w-xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Local shopping, without the local search.
          </h2>
        </Reveal>
        <ol className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-6">
          <div className="absolute bottom-2 left-5 top-5 w-px bg-line md:bottom-auto md:left-[12.5%] md:top-5 md:h-px md:w-3/4" aria-hidden="true" />
          {reduce ? null : (
            <motion.div
              className="absolute top-5 hidden h-px origin-left bg-brand md:left-[12.5%] md:block md:w-3/4"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              aria-hidden="true"
            />
          )}
          {steps.map((step, index) => (
            <li key={step.n} className="relative pl-12 md:pl-0">
              <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center border border-line bg-white font-display text-lg text-ink md:relative">
                {step.n}
              </span>
              <h3 className="mt-1 font-semibold md:mt-5">{step.title}</h3>
              <p className="mt-2 max-w-[16rem] text-sm leading-6 text-muted">{step.body}</p>
              <span className="sr-only">{`Step ${index + 1} of ${steps.length}`}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
