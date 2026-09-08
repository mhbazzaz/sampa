import { Inject } from '@nestjs/common';
import { Channel, connect } from 'amqp-connection-manager';
import amqplib from 'amqplib';
import { Dotenv } from 'src/config/dotenv';
import { Role } from 'src/role/entities/role.entity';
import { User } from 'src/users/entities/user.entity';
import { DataSource, In } from 'typeorm';

export class RabbitMQService {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {
    const connection = connect([
      `amqp://${Dotenv.instance.env.RABBITMQ_USERNAME}:${Dotenv.instance.env.RABBITMQ_PASSWORD}@${Dotenv.instance.env.RABBITMQ_HOST}`,
    ]);
    connection.on('connect', function () {
      console.log('amqp connected!');
    });
    connection.on('disconnect', function (err: any) {
      console.log('amqp disconnected.', err);
    });
    connection.on('connectFailed', function (err: any) {
      console.log('amqp connectFailed.', err);
    });

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    connection.createChannel({
      setup: function (channel: Channel) {
        return Promise.all([
          channel.prefetch(1),

          channel.assertExchange('user_channel_dead', 'topic', {
            durable: true,
          }),
          channel.assertExchange('user_channel', 'topic', { durable: true }),

          channel.assertQueue('dead_letter_user_queue_asset_management', {
            durable: true,
          }),
          channel.bindQueue(
            'dead_letter_user_queue_asset_management',
            'user_channel_dead',
            'dead_letter',
          ),

          channel.assertQueue('user_queue_asset_management', {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'user_channel_dead',
              'x-dead-letter-routing-key': 'dead_letter',
            },
          }),
          channel.bindQueue(
            'user_queue_asset_management',
            'user_channel',
            'user_queue',
          ),

          channel.consume('user_queue_asset_management', (data) => {
            if (!data) {
              return;
            }
            self.newUser(channel, data);
          }),
        ]);
      },
    });

    connection.createChannel({
      setup: function (channel: Channel) {
        return Promise.all([
          channel.prefetch(1),

          channel.assertExchange('role_channel_dead', 'topic', {
            durable: true,
          }),
          channel.assertExchange('role_channel', 'topic', { durable: true }),

          channel.assertQueue('dead_letter_role_queue_asset_management', {
            durable: true,
          }),
          channel.bindQueue(
            'dead_letter_role_queue_asset_management',
            'role_channel_dead',
            'dead_letter',
          ),

          channel.assertQueue('role_queue_asset_management', {
            durable: true,
            arguments: {
              'x-dead-letter-exchange': 'role_channel_dead',
              'x-dead-letter-routing-key': 'dead_letter',
            },
          }),
          channel.bindQueue(
            'role_queue_asset_management',
            'role_channel',
            'role_queue',
          ),

          channel.consume('role_queue_asset_management', (data) => {
            if (!data) {
              return;
            }
            self.changedUserRole(channel, data);
          }),
        ]);
      },
    });
  }

  public newUser = async (channel: Channel, data: amqplib.ConsumeMessage) => {
    try {
      const message = JSON.parse(data.content.toString());

      const user = new User({ id: message.id });
      await this.dataSource.getRepository(User).save(user);
      channel.ack(data);
    } catch (error) {
      console.log(error);
      channel.nack(data, false, false);
    }
  };

  public changedUserRole = async (
    channel: Channel,
    data: amqplib.ConsumeMessage,
  ) => {
    try {
      const message: User = JSON.parse(data.content.toString());
      if (!message.roles || message.roles.length === 0) {
        await this.dataSource.getRepository(User).save(message);
        channel.ack(data);
        return;
      }
      const roles = message.roles.map((role) => role.id);
      const fetchedRoles = await this.dataSource
        .getRepository(Role)
        .find({ where: { id: In(roles) } });
      message.roles = message.roles.filter((role) => {
        const existing = fetchedRoles.findIndex((fr) => fr.id === role.id);
        return existing > -1;
      });
      await this.dataSource.getRepository(User).save(message);
      channel.ack(data);
    } catch (error) {
      console.log(error);
      channel.nack(data, false, false);
    }
  };
}
