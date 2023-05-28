import { Document } from './document.model';
import { Test } from './test.model';
export class Category {
  _id: string;
  parentRNCPTitle: string;
  parentCategory: string;
  title: string;
  description: string;
  documents: Document[] = [];
  tests: Test[] = [];
  subCategories: Category[] = [];
  createdAt: Date;

  constructor(title: string, parentCategory: string, parentTitle: string, description? : string, subCateogries?: Category[], documents?: Document[], tests?: Test[]) {
    this.title = title;
    this.parentCategory = parentCategory;
    this.parentRNCPTitle = parentTitle;
    this.description = description || '';
    this.subCategories = subCateogries || [];
    this.documents = documents || [];
    this.tests = tests || [];
    this.createdAt = new Date();

  }
}
