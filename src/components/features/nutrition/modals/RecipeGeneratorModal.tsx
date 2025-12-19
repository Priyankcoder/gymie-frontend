
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView } from 'react-native';
import { Card, Button } from '../../../ui';
import { useTheme } from '../../../../contexts/ThemeContext';
import { api } from '../../../../services/api';
import { Recipe } from '../../../../types';
import { RecipeCard } from '../components/RecipeCard';

interface RecipeGeneratorModalProps {
  onRecipesGenerated?: (recipes: Recipe[]) => void;
}

export const RecipeGeneratorModal: React.FC<RecipeGeneratorModalProps> = ({
  onRecipesGenerated,
}) => {
  const { colors, borderRadius } = useTheme();
  const [ingredients, setIngredients] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateRecipes = async () => {
    if (!ingredients.trim()) {
      Alert.alert('Required', 'Please enter some ingredients');
      return;
    }

    setIsGenerating(true);
    try {
      const ingredientList = ingredients.split(',').map((i) => i.trim());
      const response = await api.recipes.generateFromIngredients(ingredientList);
      if (response.data) {
        setRecipes(response.data);
        onRecipesGenerated?.(response.data);
      }
    } catch (error) {
      console.error('Error generating recipes:', error);
      Alert.alert('Error', 'Failed to generate recipes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.generatorCard}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Recipe Generator
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Enter ingredients to get recipe suggestions
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.inputBackground,
              color: colors.textPrimary,
              borderRadius: borderRadius.md,
            },
          ]}
          value={ingredients}
          onChangeText={setIngredients}
          placeholder="e.g., chicken, rice, broccoli"
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <Button
          title="Generate Recipes"
          onPress={generateRecipes}
          loading={isGenerating}
          style={{ marginTop: 12 }}
        />
      </Card>

      {recipes.length > 0 && (
        <Text style={[styles.recipesTitle, { color: colors.textPrimary }]}>
          Suggested Recipes
        </Text>
      )}

      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  generatorCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    height: 80,
    padding: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  recipesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
});
