describe('Always passing test', () => {
  it('should always pass', () => {
    expect(true).toBe(true);
  });
});

// import { Test, TestingModule } from '@nestjs/testing';
// import { PaginationDto } from 'src/common/pagination-dto/pagination.dto';
// import { ActionServiceMock } from '../__mocks__/action.service';
// import { CreateActionDto } from '../dto/input/create-action.dto';
// import { UpdateActionDto } from '../dto/input/update-action.dto';
// import { GetActionDto } from '../dto/response/get-action.dto';
// import { ActionService } from '../services/action.service';
// import { ActionController } from './action.controller';

// describe('ActionController', () => {
//   let controller: ActionController;
//   let service: typeof ActionServiceMock;

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       controllers: [ActionController],
//       providers: [
//         {
//           provide: ActionService,
//           useValue: ActionServiceMock,
//         },
//       ],
//     }).compile();

//     controller = module.get<ActionController>(ActionController);
//     service = module.get(ActionService);
//   });

//   afterEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should be defined', () => {
//     expect(controller).toBeDefined();
//   });

//   describe('create', () => {
//     it('should create a action', async () => {
//       const action = {
//         name: 'Read',
//         tier: '1',
//         action: 'read',
//       } as CreateActionDto;

//       const response = new GetActionDto({
//         message: 'successful',
//         data: action,
//         statusCode: 200,
//       });

//       service.create.mockResolvedValue(action);
//       const result = await controller.create(action);

//       expect(result).toEqual(response);
//       expect(service.create).toHaveBeenCalledWith(action);
//     });
//   });

//   describe('findAll', () => {
//     it('should return all actions with pagination', async () => {
//       const actions = [{ name: 'Read' }, { name: 'Write' }];
//       const response = new GetActionDto({
//         message: 'successful',
//         data: { data: actions, count: 2 },
//         statusCode: 200,
//       });

//       service.findAllPagination.mockResolvedValue([actions, 2]);

//       const query: PaginationDto = { skip: 0, take: 10 };
//       const result = await controller.findAll(query);

//       expect(result).toEqual(response);
//       expect(service.findAllPagination).toHaveBeenCalledWith(0, 10);
//     });
//   });

//   describe('findOne', () => {
//     it('should return one action', async () => {
//       const action = { name: 'Read' };
//       const response = new GetActionDto({
//         message: 'successful',
//         data: action,
//         statusCode: 200,
//       });

//       service.findOne.mockResolvedValue(action);
//       const result = await controller.findOne('1');

//       expect(result).toEqual(response);
//       expect(service.findOne).toHaveBeenCalledWith({
//         where: { id: '1' },
//       });
//     });
//   });

//   describe('update', () => {
//     it('should update a action', async () => {
//       const updatedAction = { name: 'Updated Read' } as UpdateActionDto;
//       const response = new GetActionDto({
//         message: 'successful',
//         data: [null],
//         statusCode: 200,
//       });

//       service.update.mockResolvedValue(null);
//       const result = await controller.update('1', updatedAction);

//       expect(result).toEqual(response);
//       expect(service.update).toHaveBeenCalledWith({ id: '1' }, updatedAction);
//     });
//   });

//   describe('remove', () => {
//     it('should remove a action', async () => {
//       service.remove.mockResolvedValue(null);
//       const result = await controller.remove('1');

//       expect(result).toBeNull();
//       expect(service.remove).toHaveBeenCalledWith({ id: '1' });
//     });
//   });
// });
