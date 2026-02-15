/**
 * Base Repository Interface
 *
 * Repository Pattern을 위한 기본 인터페이스입니다.
 * 모든 Repository는 이 인터페이스를 구현해야 합니다.
 *
 * @template T - Entity 타입
 * @template CreateInput - 생성 시 입력 타입 (Prisma.XxxCreateInput)
 * @template UpdateInput - 수정 시 입력 타입 (Prisma.XxxUpdateInput)
 */
export interface BaseRepository<T, CreateInput, UpdateInput> {
  /**
   * ID로 단일 엔티티 조회
   */
  findById(id: string): Promise<T | null>

  /**
   * 모든 엔티티 조회
   */
  findAll(): Promise<T[]>

  /**
   * 엔티티 생성
   */
  create(data: CreateInput): Promise<T>

  /**
   * 엔티티 수정
   */
  update(id: string, data: UpdateInput): Promise<T>

  /**
   * 엔티티 삭제
   */
  delete(id: string): Promise<T>
}
