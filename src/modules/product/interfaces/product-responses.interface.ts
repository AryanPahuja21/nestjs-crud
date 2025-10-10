import { Product } from '../../../database/schemas/product.schema';
import {
  ListResponse,
  ItemResponse,
  DeleteResponse,
  ApiPaginatedResponse,
} from '../../../types/response.types';

// Standard product responses
export type ProductListResponse = ListResponse<Product>;
export type ProductItemResponse = ItemResponse<Product>;
export type ProductDeleteResponse = DeleteResponse;

// Paginated products response
export type ProductPaginatedResponse = ApiPaginatedResponse<Product>;

// Product creation response
export type ProductCreateResponse = ItemResponse<Product>;

// Product update response
export type ProductUpdateResponse = ItemResponse<Product>;

// Product search response (could include additional metadata)
export interface ProductSearchResponse extends ProductListResponse {
  data: Product[];
  searchQuery?: string;
  totalFound?: number;
}
