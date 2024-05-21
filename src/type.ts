import { TaskBaseFragment } from './generated/graphql'

export interface GenerateImageOptions {
  onUpdate?: (task: TaskBaseFragment) => void
}
