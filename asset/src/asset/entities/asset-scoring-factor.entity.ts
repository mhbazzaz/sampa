import { AbstractEntity } from 'src/database/abstract.entity';
import { Column, Entity, OneToMany } from 'typeorm';
import { AssetScore } from './asset-score.entity';

@Entity()
export class AssetScoringFactor extends AbstractEntity<AssetScoringFactor> {
  @Column('decimal', {
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  weight: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @OneToMany(() => AssetScore, (assetScore) => assetScore.factor)
  scores?: AssetScore[];
}
