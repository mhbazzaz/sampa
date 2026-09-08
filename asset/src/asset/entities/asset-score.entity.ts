import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { AssetScoringFactor } from './asset-scoring-factor.entity';

@Entity()
export class AssetScore extends AbstractEntity<AssetScore> {
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  value: number;

  @Column()
  description: string;

  @Column()
  factorId: string;

  @ManyToOne(() => AssetScoringFactor)
  factor?: AssetScoringFactor;
}
