export interface Message {
    id: string;
    postedBy?: string;
    postedOn?: string;
    backgroundColor?: string;
    messageContent?: string;
    priority?: string;
    status?: string;
    type?: string;
    fileUrl?: string;
    fileThumbnailImageUrl?: string;
    imageUrl?: string;
    articleUrl?: string;
    isShareable?: boolean;
    isBookmarked?: boolean;
    source?: string;
    feedType?: string;
    commodity?: string;
    subCommodity?: string;
    feedTopic?: string;
    region?: string;
    bookmarkTracking?: string[];
}
