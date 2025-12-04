const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'camilo7532';

async function register(req, res) {
  console.log('Registro:', req.body.email);
  const { name, email, password, role, contactWhatsapp } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'El correo ya existe' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const validRoles = ['cliente', 'vendedor', 'admin'];
    const finalRole = validRoles.includes(role) ? role : 'cliente';

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: finalRole,
      contactWhatsapp,
    });

    await newUser.save();

    console.log(' Usuario creado:', email);
    return res.status(201).json({
      message: 'Usuario registrado con éxito.',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        contactWhatsapp: newUser.contactWhatsapp,
      },
    });
  } catch (error) {
    console.error('Error registro:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function login(req, res) {
  console.log(' Login body recibido:', req.body);

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Faltan email o contraseña' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contactWhatsapp: user.contactWhatsapp,
      },
    });
  } catch (error) {
    console.error('Error login:', error);
    return res.status(500).json({ message: 'Error del servidor' });
  }
}

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('name email role contactWhatsapp');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Usuario autenticado',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        contactWhatsapp: user.contactWhatsapp,
      },
    });
  } catch (err) {
    console.error('Error en GET /api/me:', err);
    return res.status(500).json({ message: 'Error al recuperar el usuario' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, contactWhatsapp } = req.body || {};

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: 'El nombre no puede estar vacío.' });
      }
      updates.name = name.trim();
    }

    if (contactWhatsapp !== undefined) {
      updates.contactWhatsapp = contactWhatsapp ? contactWhatsapp.trim() : undefined;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No se enviaron cambios para actualizar.' });
    }

    const updated = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select(
      'name email role contactWhatsapp'
    );

    if (!updated) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Perfil actualizado con éxito',
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        contactWhatsapp: updated.contactWhatsapp,
      },
    });
  } catch (error) {
    console.error('Error en PATCH /api/me:', error);
    return res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
}

function adminSales(req, res) {
  res.json({
    message: 'Solo administradores pueden ver esta información',
  });
}

module.exports = {
  adminSales,
  getProfile,
  login,
  register,
  updateProfile,
};
