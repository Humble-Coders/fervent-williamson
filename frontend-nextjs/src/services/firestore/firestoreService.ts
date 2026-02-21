import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
  QueryConstraint,
  QueryDocumentSnapshot,
  DocumentData,
  DocumentReference,
  CollectionReference,
  Timestamp,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { db } from '@/config/firebase';

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert a Firestore document snapshot to a plain object with id
 */
export function docToObject<T>(doc: DocumentSnapshot | QueryDocumentSnapshot): T & { id: string } {
  const data = doc.data();
  if (!data) throw new Error(`Document ${doc.id} does not exist`);

  // Convert Firestore Timestamps to ISO strings
  const converted: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Timestamp) {
      converted[key] = value.toDate().toISOString();
    } else {
      converted[key] = value;
    }
  }

  return { id: doc.id, ...converted } as T & { id: string };
}

/**
 * Result type for paginated queries
 */
export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}

/**
 * Filter condition for queries
 */
export interface QueryFilter {
  field: string;
  op: WhereFilterOp;
  value: any;
}

/**
 * Sort condition for queries
 */
export interface QuerySort {
  field: string;
  direction: OrderByDirection;
}

// ============================================================================
// FIRESTORE SERVICE - Top-level collections
// ============================================================================

/**
 * Generic Firestore service for top-level collections.
 * Provides CRUD + pagination + query helpers.
 */
export class FirestoreService<T extends { id?: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected get collectionRef(): CollectionReference {
    return collection(db, this.collectionName);
  }

  protected docRef(id: string): DocumentReference {
    return doc(db, this.collectionName, id);
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T & { id: string }> {
    const docSnap = await getDoc(this.docRef(id));
    if (!docSnap.exists()) {
      throw new Error(`${this.collectionName}/${id} not found`);
    }
    return docToObject<T>(docSnap);
  }

  /**
   * Get all documents (optionally with filters, sorting, limit)
   */
  async getAll(options?: {
    filters?: QueryFilter[];
    sort?: QuerySort;
    limitCount?: number;
  }): Promise<(T & { id: string })[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.filters) {
      for (const f of options.filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }

    if (options?.sort) {
      constraints.push(orderBy(options.sort.field, options.sort.direction));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => docToObject<T>(doc));
  }

  /**
   * Get documents with cursor-based pagination
   */
  async getPaginated(options: {
    filters?: QueryFilter[];
    sort?: QuerySort;
    pageSize: number;
    lastDoc?: QueryDocumentSnapshot | null;
  }): Promise<PaginatedResult<T & { id: string }>> {
    const constraints: QueryConstraint[] = [];

    if (options.filters) {
      for (const f of options.filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }

    if (options.sort) {
      constraints.push(orderBy(options.sort.field, options.sort.direction));
    }

    if (options.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }

    // Fetch one extra to know if there's more
    constraints.push(limit(options.pageSize + 1));

    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    const hasMore = docs.length > options.pageSize;
    const resultDocs = hasMore ? docs.slice(0, options.pageSize) : docs;
    const lastDoc = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

    return {
      data: resultDocs.map((d) => docToObject<T>(d)),
      lastDoc,
      hasMore,
    };
  }

  /**
   * Create a new document (auto-generated ID)
   */
  async create(data: Omit<T, 'id'>): Promise<T & { id: string }> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(this.collectionRef, docData);
    const newDoc = await getDoc(docRef);
    return docToObject<T>(newDoc);
  }

  /**
   * Create a document with a specific ID
   */
  async createWithId(id: string, data: Omit<T, 'id'>): Promise<T & { id: string }> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = this.docRef(id);
    await setDoc(ref, docData);
    const newDoc = await getDoc(ref);
    return docToObject<T>(newDoc);
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<T>): Promise<T & { id: string }> {
    const ref = this.docRef(id);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    } as DocumentData);
    const updatedDoc = await getDoc(ref);
    return docToObject<T>(updatedDoc);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(this.docRef(id));
  }

  /**
   * Check if a document exists
   */
  async exists(id: string): Promise<boolean> {
    const docSnap = await getDoc(this.docRef(id));
    return docSnap.exists();
  }

  /**
   * Get the count of documents (optionally filtered)
   */
  async count(filters?: QueryFilter[]): Promise<number> {
    const constraints: QueryConstraint[] = [];
    if (filters) {
      for (const f of filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }
    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }
}

// ============================================================================
// SUBCOLLECTION SERVICE - Nested collections (e.g., salons/{id}/services)
// ============================================================================

/**
 * Generic Firestore service for subcollections.
 * Works within a parent document context.
 */
export class SubcollectionService<T extends { id?: string }> {
  protected parentCollection: string;
  protected subcollectionName: string;

  constructor(parentCollection: string, subcollectionName: string) {
    this.parentCollection = parentCollection;
    this.subcollectionName = subcollectionName;
  }

  protected getCollectionRef(parentId: string): CollectionReference {
    return collection(db, this.parentCollection, parentId, this.subcollectionName);
  }

  protected getDocRef(parentId: string, docId: string): DocumentReference {
    return doc(db, this.parentCollection, parentId, this.subcollectionName, docId);
  }

  /**
   * Get a single document from the subcollection
   */
  async getById(parentId: string, docId: string): Promise<T & { id: string }> {
    const docSnap = await getDoc(this.getDocRef(parentId, docId));
    if (!docSnap.exists()) {
      throw new Error(`${this.parentCollection}/${parentId}/${this.subcollectionName}/${docId} not found`);
    }
    return docToObject<T>(docSnap);
  }

  /**
   * Get all documents from the subcollection
   */
  async getAll(parentId: string, options?: {
    filters?: QueryFilter[];
    sort?: QuerySort;
    limitCount?: number;
  }): Promise<(T & { id: string })[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.filters) {
      for (const f of options.filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }

    if (options?.sort) {
      constraints.push(orderBy(options.sort.field, options.sort.direction));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(this.getCollectionRef(parentId), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToObject<T>(d));
  }

  /**
   * Get paginated documents from the subcollection
   */
  async getPaginated(parentId: string, options: {
    filters?: QueryFilter[];
    sort?: QuerySort;
    pageSize: number;
    lastDoc?: QueryDocumentSnapshot | null;
  }): Promise<PaginatedResult<T & { id: string }>> {
    const constraints: QueryConstraint[] = [];

    if (options.filters) {
      for (const f of options.filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }

    if (options.sort) {
      constraints.push(orderBy(options.sort.field, options.sort.direction));
    }

    if (options.lastDoc) {
      constraints.push(startAfter(options.lastDoc));
    }

    constraints.push(limit(options.pageSize + 1));

    const q = query(this.getCollectionRef(parentId), ...constraints);
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    const hasMore = docs.length > options.pageSize;
    const resultDocs = hasMore ? docs.slice(0, options.pageSize) : docs;
    const lastDocSnap = resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null;

    return {
      data: resultDocs.map((d) => docToObject<T>(d)),
      lastDoc: lastDocSnap,
      hasMore,
    };
  }

  /**
   * Create a new document in the subcollection (auto-generated ID)
   */
  async create(parentId: string, data: Omit<T, 'id'>): Promise<T & { id: string }> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(this.getCollectionRef(parentId), docData);
    const newDoc = await getDoc(docRef);
    return docToObject<T>(newDoc);
  }

  /**
   * Create a document with a specific ID
   */
  async createWithId(parentId: string, docId: string, data: Omit<T, 'id'>): Promise<T & { id: string }> {
    const docData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = this.getDocRef(parentId, docId);
    await setDoc(ref, docData);
    const newDoc = await getDoc(ref);
    return docToObject<T>(newDoc);
  }

  /**
   * Update a document in the subcollection
   */
  async update(parentId: string, docId: string, data: Partial<T>): Promise<T & { id: string }> {
    const ref = this.getDocRef(parentId, docId);
    await updateDoc(ref, {
      ...data,
      updatedAt: serverTimestamp(),
    } as DocumentData);
    const updatedDoc = await getDoc(ref);
    return docToObject<T>(updatedDoc);
  }

  /**
   * Delete a document from the subcollection
   */
  async delete(parentId: string, docId: string): Promise<void> {
    await deleteDoc(this.getDocRef(parentId, docId));
  }

  /**
   * Count documents in the subcollection
   */
  async count(parentId: string, filters?: QueryFilter[]): Promise<number> {
    const constraints: QueryConstraint[] = [];
    if (filters) {
      for (const f of filters) {
        constraints.push(where(f.field, f.op, f.value));
      }
    }
    const q = query(this.getCollectionRef(parentId), ...constraints);
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  }
}

// ============================================================================
// RE-EXPORT FIRESTORE UTILITIES
// ============================================================================

export {
  db,
  writeBatch,
  runTransaction,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
};

export type {
  QueryDocumentSnapshot,
  DocumentSnapshot,
  DocumentData,
  DocumentReference,
  CollectionReference,
  QueryConstraint,
};
