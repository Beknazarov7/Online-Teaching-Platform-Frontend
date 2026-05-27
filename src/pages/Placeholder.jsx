/**
 * Stand-in for pages that will be built in batch 2.
 * Lets the nav links work without dead-ending in a 404.
 */
import Card from '../components/Card'
import Icon from '../components/Icon'

export default function Placeholder({ title }) {
  return (
    <Card className="p-xl text-center">
      <Icon name="construction" className="text-5xl text-secondary mb-md" />
      <h2 className="text-h2 font-h2 text-on-surface dark:text-dark-on-surface">{title}</h2>
      <p className="text-secondary mt-1">This page is part of the next batch.</p>
    </Card>
  )
}
