import { randomUserMock, additionalUsers } from './FE4U-Lab2-mock.js';

const COURSES = [
  'Mathematics', 'Physics', 'English', 'Computer Science', 'Dancing', 'Chess',
  'Biology', 'Chemistry', 'Law', 'Art', 'Medicine', 'Statistics',
];

const DEFAULT_NOTE = 'No notes yet.';

const PHONE_FORMATS = {
  Germany: /^\d{4}-\d{7}$/,
  Ireland: /^\d{3}-\d{3}-\d{4}$/,
  Australia: /^\d{2}-\d{4}-\d{4}$/,
  'United States': /^\(\d{3}\)-\d{3}-\d{4}$/,
  Finland: /^\d{2}-\d{3}-\d{3}$/,
  Turkey: /^\(\d{3}\)-\d{3}-\d{4}$/,
  Switzerland: /^\d{3} \d{3} \d{2} \d{2}$/,
  'New Zealand': /^\(\d{3}\)-\d{3}-\d{4}$/,
  Spain: /^\d{3}-\d{3}-\d{3}$/,
  Norway: /^\d{8}$/,
  Denmark: /^\d{8}$/,
  Iran: /^\d{3}-\d{8}$/,
  Canada: /^\d{3}-\d{3}-\d{4}$/,
  France: /^\d{2}(-\d{2}){4}$/,
  Netherlands: /^\(\d{3}\)-\d{3}-\d{4}$/,
};
const GENERIC_PHONE_FORMAT = /^[\d\s()+-]{6,}$/;

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CAPITALIZED_FIELDS = ['full_name', 'gender', 'note', 'state', 'city', 'country'];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

const randomColor = () =>
  `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`;

const isPresent = (value) => value !== null && value !== undefined;

const calculateAge = (isoDate) => {
  const birth = new Date(isoDate);
  if (Number.isNaN(birth.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  return hadBirthday ? age : age - 1;
};

function formatRandomUser(user) {
  return {
    gender: user.gender,
    title: user.name.title,
    full_name: `${user.name.first} ${user.name.last}`,
    city: user.location.city,
    state: user.location.state,
    country: user.location.country,
    postcode: user.location.postcode,
    coordinates: user.location.coordinates,
    timezone: user.location.timezone,
    email: user.email,
    b_day: user.dob.date,
    age: user.dob.age,
    phone: user.phone,
    picture_large: user.picture.large,
    picture_thumbnail: user.picture.thumbnail,
    id: user.login.uuid,
  };
}

function isSameUser(a, b) {
  const sameEmail =
    isPresent(a.email) && isPresent(b.email) && a.email.toLowerCase() === b.email.toLowerCase();
  const sameName =
    isPresent(a.full_name) && isPresent(b.full_name) &&
    a.full_name.toLowerCase() === b.full_name.toLowerCase();
  return sameEmail || sameName;
}

function mergeUsers(base, extra) {
  const defined = Object.fromEntries(Object.entries(extra).filter(([, v]) => isPresent(v)));
  return { ...base, ...defined };
}

function completeUser(user) {
  const course = COURSES.find((c) => c.toLowerCase() === String(user.course).toLowerCase());
  const completed = {
    ...user,
    id: isPresent(user.id) ? String(user.id) : crypto.randomUUID(),
    favorite: typeof user.favorite === 'boolean' ? user.favorite : false,
    course: course ?? pickRandom(COURSES),
    bg_color: typeof user.bg_color === 'string' ? user.bg_color : randomColor(),
    note: typeof user.note === 'string' ? user.note : DEFAULT_NOTE,
  };
  if (!isPresent(completed.age) && isPresent(completed.b_day)) {
    const age = calculateAge(completed.b_day);
    if (age !== undefined) completed.age = age;
  }
  return completed;
}

function prepareUsers(randomUsers, additionalUsers) {
  const all = [
    ...randomUsers.map(formatRandomUser),
    ...structuredClone(additionalUsers),
  ];

  const unique = [];
  for (const user of all) {
    const index = unique.findIndex((existing) => isSameUser(existing, user));
    if (index === -1) unique.push(user);
    else unique[index] = mergeUsers(unique[index], user);
  }

  return unique.map(completeUser);
}

function isCapitalizedString(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  const [first] = value;
  return /\p{L}/u.test(first) && first === first.toUpperCase();
}

function getValidationErrors(user) {
  const errors = [];

  for (const field of CAPITALIZED_FIELDS) {
    if (!isCapitalizedString(user[field])) {
      errors.push(`${field}: має бути рядком, що починається з великої літери`);
    }
  }

  if (typeof user.age !== 'number' || Number.isNaN(user.age)) {
    errors.push('age: має бути числом');
  }

  const phoneFormat = PHONE_FORMATS[user.country] ?? GENERIC_PHONE_FORMAT;
  if (typeof user.phone !== 'string' || !phoneFormat.test(user.phone)) {
    errors.push(`phone: не відповідає формату для країни "${user.country}"`);
  }

  if (typeof user.email !== 'string' || !EMAIL_FORMAT.test(user.email)) {
    errors.push('email: некоректний формат (потрібен символ @)');
  }

  return errors;
}

function validateUser(user) {
  return getValidationErrors(user).length === 0;
}

const normalize = (value) => (typeof value === 'string' ? value.toLowerCase() : value);

function filterUsers(users, { country, age, gender, favorite } = {}) {
  const criteria = Object.entries({ country, age, gender, favorite }).filter(
    ([, value]) => value !== undefined,
  );
  return users.filter((user) =>
    criteria.every(([field, value]) => normalize(user[field]) === normalize(value)),
  );
}

const SORTABLE_FIELDS = {
  full_name: (user) => user.full_name,
  age: (user) => user.age,
  b_day: (user) => {
    const time = Date.parse(user.b_day);
    return Number.isNaN(time) ? undefined : time;
  },
  country: (user) => user.country,
};

function sortUsers(users, field, order = 'asc') {
  if (!(field in SORTABLE_FIELDS)) {
    throw new Error(`Сортування за "${field}" не підтримується: ${Object.keys(SORTABLE_FIELDS).join(', ')}`);
  }
  if (order !== 'asc' && order !== 'desc') {
    throw new Error('order має бути "asc" або "desc"');
  }

  const getValue = SORTABLE_FIELDS[field];
  const direction = order === 'asc' ? 1 : -1;

  return [...users].sort((a, b) => {
    const valueA = getValue(a);
    const valueB = getValue(b);
    if (!isPresent(valueA) && !isPresent(valueB)) return 0;
    if (!isPresent(valueA)) return 1;
    if (!isPresent(valueB)) return -1;
    const result = typeof valueA === 'string' ? valueA.localeCompare(valueB) : valueA - valueB;
    return result * direction;
  });
}

const SEARCH_FIELD_ALIASES = { name: 'full_name', full_name: 'full_name', note: 'note', age: 'age' };

const OPERATORS = {
  '===': (a, b) => a === b,
  '!==': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  includes: (a, b) => String(a).includes(String(b)),
};

function matchesSearch(user, field, value, operator) {
  const actual = user[field];
  if (!isPresent(actual)) return false;
  return OPERATORS[operator](normalize(actual), normalize(value));
}

function resolveSearch(field, value, operator) {
  const realField = SEARCH_FIELD_ALIASES[field];
  if (!realField) {
    throw new Error(`Пошук за "${field}" не підтримується: ${Object.keys(SEARCH_FIELD_ALIASES).join(', ')}`);
  }
  const op = operator ?? (typeof value === 'string' ? 'includes' : '===');
  if (!(op in OPERATORS)) {
    throw new Error(`Невідомий оператор "${op}": ${Object.keys(OPERATORS).join(', ')}`);
  }
  return { realField, op };
}

function findUser(users, field, value, operator) {
  const { realField, op } = resolveSearch(field, value, operator);
  return users.find((user) => matchesSearch(user, realField, value, op)) ?? null;
}

function getMatchPercentage(users, field, value, operator) {
  if (users.length === 0) return 0;
  const { realField, op } = resolveSearch(field, value, operator);
  const matched = users.filter((user) => matchesSearch(user, realField, value, op)).length;
  return Math.round((matched / users.length) * 10000) / 100;
}

const brief = (users) =>
  users.map(({ full_name, age, country, gender, favorite, b_day }) =>
    ({ full_name, age, country, gender, favorite, b_day }));

const users = prepareUsers(randomUserMock, additionalUsers);
console.log(`\n=== Завдання 1: ${randomUserMock.length} + ${additionalUsers.length} -> ${users.length} унікальних ===`);
console.log(users.find((u) => u.full_name === 'Norbert Weishaupt'));

console.log('\n=== Завдання 2: валідація ===');
const validCount = users.filter(validateUser).length;
console.log(`Валідних: ${validCount} з ${users.length}`);
const payne = users.find((u) => u.full_name === 'Claude Payne');
console.log('Помилки Claude Payne:', getValidationErrors(payne));
console.log('Він же з gender "Male":', validateUser({ ...payne, gender: 'Male' }));
console.log('Некоректні email/age/phone:', getValidationErrors({ ...payne, gender: 'Male', email: 'abc', age: '30', phone: '123' }));

console.log('\n=== Завдання 3: filterUsers({ country: "Germany", gender: "male" }) ===');
console.table(brief(filterUsers(users, { country: 'Germany', gender: 'male' })));
console.log('favorite: true ->', filterUsers(users, { favorite: true }).map((u) => u.full_name));

console.log('\n=== Завдання 4: sortUsers(users, "age", "desc"), перші 5 ===');
console.table(brief(sortUsers(users, 'age', 'desc').slice(0, 5)));
console.log('=== sortUsers(users, "country", "asc"), перші 5 ===');
console.table(brief(sortUsers(users, 'country', 'asc').slice(0, 5)));
console.log('=== sortUsers(users, "b_day", "asc"), перші 3 ===');
console.table(brief(sortUsers(users, 'b_day', 'asc').slice(0, 3)));

console.log('\n=== Завдання 5: пошук ===');
console.log('name "payne":', findUser(users, 'name', 'payne')?.full_name);
console.log('note "cats":', findUser(users, 'note', 'cats')?.full_name);
console.log('age 46:', findUser(users, 'age', 46)?.full_name);
console.log('age 1000:', findUser(users, 'age', 1000));

console.log('\n=== Завдання 6: відсоток ===');
console.log('age > 30:', getMatchPercentage(users, 'age', 30, '>'), '%');
console.log('age <= 30:', getMatchPercentage(users, 'age', 30, '<='), '%');
console.log('name містить "an":', getMatchPercentage(users, 'name', 'an'), '%');