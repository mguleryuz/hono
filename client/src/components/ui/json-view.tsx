'use client'

import * as React from 'react'
import { cn } from '@c/utils'
import {
  allExpanded,
  defaultStyles,
  JsonView as JsonViewOrg,
} from 'react-json-view-lite'

type anyArray = (
  | object
  | string
  | number
  | boolean
  | null
  | undefined
  | bigint
  | symbol
  | anyArray
)[]

export const JsonView = ({
  json,
  className,
}: {
  json: object | anyArray
  className?: string
}) => {
  return (
    <div className={cn(className, 'in--rounded-sm')}>
      <JsonViewOrg
        data={json}
        shouldExpandNode={allExpanded}
        style={defaultStyles}
      />
    </div>
  )
}
