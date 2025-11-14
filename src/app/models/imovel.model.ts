import { EnderecoCreateRequest, EnderecoDto, EnderecoUpdateRequest } from "./endereco.model";

export interface ImovelDto {
  id: string;
  codigo: string;
  endereco: EnderecoDto | null;
}

export interface ImovelCreateRequest {
  codigo: string;
  endereco: EnderecoCreateRequest;
}

export interface ImovelUpdateRequest {
  id: string;
  codigo: string;
  endereco: EnderecoUpdateRequest;
}