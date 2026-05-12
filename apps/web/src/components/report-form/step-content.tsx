'use client'

import {
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
  MIN_BODY_LENGTH,
  MAX_BODY_LENGTH,
} from '@mame/shared/constants'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Brief description of the incident"
          minLength={MIN_TITLE_LENGTH}
          maxLength={MAX_TITLE_LENGTH}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {title.length}/{MAX_TITLE_LENGTH} characters (min {MIN_TITLE_LENGTH})
        </p>
      </div>
      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <Textarea
          id="body"
          rows={8}
          value={body}
          onChange={(e) => onUpdate({ body: e.target.value })}
          placeholder="Provide a detailed account of what happened..."
          minLength={MIN_BODY_LENGTH}
          maxLength={MAX_BODY_LENGTH}
          className="min-h-[12rem]"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {body.length}/{MAX_BODY_LENGTH} characters (min {MIN_BODY_LENGTH})
        </p>
      </div>
    </div>
  )
}
