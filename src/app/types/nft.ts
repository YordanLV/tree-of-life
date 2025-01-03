export interface NFTResponse {
  previews: {
    image_medium_url?: string;
  };
  name: string;
  description: string;
  image_url: string;
  collection: {
    name: string;
    description: string;
  };
  extra_metadata: {
    attributes: Array<{
      trait_type: string;
      value: string;
      display_type: null | string;
    }>;
  };
} 