import { Module } from '@nestjs/common';
import { HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'fa',
      loaderOptions: {
        path: path.join(__dirname, '../../src/i18n/locales/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale'] },
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
  ],
  exports: [I18nModule],
})
export class AppI18nModule {}
