export interface PaginationDTO { page: number; limit: number }
export interface CreatePostDTO { content?: string }
export interface UpdatePostDTO { content?: string; removeImagePublicIds?: string[] | string; replaceImages?: boolean | string }
export interface CreateCommentDTO { content: string }
