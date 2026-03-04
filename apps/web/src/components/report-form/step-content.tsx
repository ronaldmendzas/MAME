'use client'

import { MIN_TITLE_LENGTH, MAX_TITLE_LENGTH, MIN_BODY_LENGTH, MAX_BODY_LENGTH } from '@mame/shared/constants'

interface StepContentProps {
  title: string
  body: string
  onUpdate: (fields: { title?: string; body?: string }) => void
}

export function StepContent({ title, body, onUpdate }: StepContentProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Brief description of the incident"
          minLength={MIN_TITLE_LENGTH}
          maxLength={MAX_TITLE_LENGTH}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
        <p className="mt-1 text-xs text-neutral-500">
          {title.length}/{MAX_TITLE_LENGTH} characters (min {MIN_TITLE_LENGTH})
        </p>
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="body"
          rows={8}
          value={body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          placeholder="Provide a detailed account of what happened..."
          minLength={MIN_BODY_LENGTH}
          maxLength={MAX_BODY_LENGTH}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
        />
        <p className="mt-1 text-xs text-neutral-500">
          {body.length}/{MAX_BODY_LENGTH} characters (min {MIN_BODY_LENGTH})
        </p>
      </div>
    </div>
  )
}
