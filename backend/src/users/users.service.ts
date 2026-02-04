import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
  }

  async create(body: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(body);
    return createdUser.save();
  }

  findAll() {
    return this.userModel.find().select('-password').exec();
  }

  /** Liste des participants (role PARTICIPANT) pour l’admin (sélection dans formulaire réservation). */
  findParticipants() {
    return this.userModel
      .find({ role: 'PARTICIPANT' })
      .select('_id email firstName lastName')
      .sort({ lastName: 1, firstName: 1 })
      .exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, _updateUserDto: UpdateUserDto) {
    void _updateUserDto;
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
