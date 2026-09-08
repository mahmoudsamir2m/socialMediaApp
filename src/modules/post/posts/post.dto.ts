export interface PaginationDTO {
  page: number;
  limit: number;
  scope?: "friends" | "all";
  author?: string | undefined;
}
export interface CreatePostDTO {
  content?: string;
}
export interface UpdatePostDTO {
  content?: string;
  removeImagePublicIds?: string[] | string;
  replaceImages?: boolean | string;
}
export interface CreateCommentDTO {
  content: string;
}
